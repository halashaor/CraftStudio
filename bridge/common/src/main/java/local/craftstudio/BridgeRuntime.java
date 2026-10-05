package local.craftstudio;

import com.google.gson.*;
import com.sun.net.httpserver.HttpExchange;
import com.sun.net.httpserver.HttpServer;
import net.minecraft.SharedConstants;
import net.minecraft.core.BlockPos;
import net.minecraft.core.registries.BuiltInRegistries;
import net.minecraft.core.registries.Registries;
import net.minecraft.nbt.*;
import net.minecraft.resources.ResourceKey;
import net.minecraft.resources.ResourceLocation;
import net.minecraft.server.MinecraftServer;
import net.minecraft.server.level.ServerLevel;
import net.minecraft.world.level.block.Block;
import net.minecraft.world.entity.player.Player;
import net.minecraft.world.phys.AABB;
import net.minecraft.world.level.block.entity.BlockEntity;
import net.minecraft.world.level.block.state.BlockState;
import net.minecraft.world.level.block.state.properties.Property;

import java.net.InetSocketAddress;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.security.SecureRandom;
import java.time.Instant;
import java.util.*;
import java.util.concurrent.*;

public class BridgeRuntime {
    private final String loader;
    private Path gameDirectory;
    private boolean allowDedicatedServer=false;
    public BridgeRuntime(String loader){this.loader=loader;}
    private static final Gson JSON = new Gson();
    private MinecraftServer server;
    private HttpServer http;
    private String token;
    private Job active;
    private Job previous;
    private final Map<String, JsonObject> jobs = new LinkedHashMap<>();
    private ExecutorService executor;

    public void start(MinecraftServer minecraftServer, Path configDirectory, Path gameDirectory) {
        this.gameDirectory=gameDirectory;
        server = minecraftServer;
        try {
            Files.createDirectories(configDirectory);
            Path settingsPath=configDirectory.resolve("craftstudio-bridge.json");JsonObject settings=new JsonObject();
            if(Files.exists(settingsPath))settings=JsonParser.parseString(Files.readString(settingsPath)).getAsJsonObject();else{settings.addProperty("port",18766);settings.addProperty("allowDedicatedServer",false);Files.writeString(settingsPath,JSON.toJson(settings));}
            int port=settings.has("port")?settings.get("port").getAsInt():18766;if(port<1024||port>65535)throw new IllegalArgumentException("Invalid bridge port");allowDedicatedServer=settings.has("allowDedicatedServer")&&settings.get("allowDedicatedServer").getAsBoolean();
            Path tokenPath = configDirectory.resolve("craftstudio-token.txt");
            if (Files.exists(tokenPath)) token = Files.readString(tokenPath).trim();
            else { byte[] bytes = new byte[32]; new SecureRandom().nextBytes(bytes); token = HexFormat.of().formatHex(bytes); Files.writeString(tokenPath, token); }
            http = HttpServer.create(new InetSocketAddress("127.0.0.1", port), 0);
            executor = Executors.newFixedThreadPool(2, r -> { Thread t = new Thread(r, "CraftStudio HTTP"); t.setDaemon(true); return t; });
            http.setExecutor(executor);
            http.createContext("/", this::request);
            http.start();
        } catch (Exception exception) { System.err.println("[CraftStudio] Bridge failed to start: " + exception.getMessage()); }
    }

    public void stop() {
        if (http != null) http.stop(0);
        if (executor != null) executor.shutdownNow();
        active = null; previous = null; jobs.clear(); server = null;
    }

    private void request(HttpExchange exchange) {
        try {
            if (!"POST".equals(exchange.getRequestMethod()) || !Objects.equals(exchange.getRequestHeaders().getFirst("Authorization"), "Bearer " + token)) {
                reply(exchange, 403, obj("error", "Invalid local bridge token")); return;
            }
            if (exchange.getRequestHeaders().containsKey("Origin")) { reply(exchange, 403, obj("error", "Use the local desktop proxy")); return; }
            byte[] data = exchange.getRequestBody().readNBytes(64 * 1024 * 1024 + 1);
            if (data.length > 64 * 1024 * 1024) throw new IllegalArgumentException("Payload too large");
            JsonObject body = JsonParser.parseString(new String(data, StandardCharsets.UTF_8)).getAsJsonObject();
            String route = exchange.getRequestURI().getPath();
            CompletableFuture<JsonObject> future = new CompletableFuture<>();
            server.execute(() -> { try { future.complete(dispatch(route, body)); } catch (Throwable e) { future.completeExceptionally(e); } });
            reply(exchange, 200, future.get(55, TimeUnit.SECONDS));
        } catch (Exception error) {
            try { String message = error.getCause() == null ? error.getMessage() : error.getCause().getMessage(); reply(exchange, 400, obj("error", String.valueOf(message))); } catch (Exception ignored) {}
        } finally { exchange.close(); }
    }

    private void reply(HttpExchange exchange, int status, JsonObject body) throws Exception {
        byte[] data = JSON.toJson(body).getBytes(StandardCharsets.UTF_8);
        exchange.getResponseHeaders().set("Content-Type", "application/json; charset=utf-8");
        exchange.sendResponseHeaders(status, data.length); exchange.getResponseBody().write(data);
    }

    private JsonObject dispatch(String route, JsonObject body) throws Exception {
        return switch (route) {
            case "/health" -> { JsonObject result = obj("status", "connected"); result.addProperty("minecraft", SharedConstants.getCurrentVersion().getName()); result.addProperty("busy", active != null);result.addProperty("protocol","craftstudio-bridge/1");result.addProperty("edition","java");result.addProperty("dedicated",server.isDedicatedServer());result.addProperty("writeEnabled",server.isDedicatedServer()?allowDedicatedServer:!server.getPlayerList().getPlayers().isEmpty()&&server.getPlayerList().getPlayers().stream().allMatch(p->p.getAbilities().instabuild));result.addProperty("loader",loader);result.addProperty("dataVersion",SharedConstants.getCurrentVersion().getDataVersion().getVersion());JsonArray capabilities=new JsonArray();for(String c:List.of("read","validate","apply","job","cancel","undo"))capabilities.add(c);result.add("capabilities",capabilities);JsonArray dimensions=new JsonArray();for(ServerLevel level:server.getAllLevels())dimensions.add(level.dimension().location().toString());result.add("dimensions",dimensions);yield result; }
            case "/read" -> { ServerLevel level = level(body); BlockPos origin = pos(body.getAsJsonArray("origin")); int[] size = ints(body.getAsJsonArray("size")); yield obj("project", read(level, origin, size)); }
            case "/validate" -> validateProject(body.getAsJsonObject("project"));
            case "/cancel" -> {if(active==null)throw new IllegalArgumentException("No active job");if(!body.has("id")||!active.id.equals(body.get("id").getAsString()))throw new IllegalArgumentException("Job ID does not match active job");Job job=active;snapshotAfter(job);job.report.addProperty("status","cancelled");job.report.addProperty("placed",job.cursor);if(!job.restoring)previous=job;active=null;yield job.report.deepCopy();}
            case "/apply" -> build(body);
            case "/job" -> { String id = body.get("id").getAsString(); if (!jobs.containsKey(id)) throw new IllegalArgumentException("Unknown job"); yield jobs.get(id).deepCopy(); }
            case "/undo" -> undo();
            default -> throw new IllegalArgumentException("Unknown route");
        };
    }

    private ServerLevel level(JsonObject body) {
        ResourceLocation id = ResourceLocation.parse(body.get("dimension").getAsString());
        ServerLevel level = server.getLevel(ResourceKey.create(Registries.DIMENSION, id));
        if (level == null) throw new IllegalArgumentException("Dimension unavailable");
        return level;
    }

    private void editable() {
        if (server.isDedicatedServer()) {if(!allowDedicatedServer)throw new IllegalArgumentException("Enable allowDedicatedServer in craftstudio-bridge.json as the server operator");} else
        if (server.getPlayerList().getPlayers().isEmpty() || server.getPlayerList().getPlayers().stream().anyMatch(p -> !p.getAbilities().instabuild))
            throw new IllegalArgumentException("Direct build requires all local players in creative mode; use exported schematics in survival");
        if (active != null) throw new IllegalArgumentException("A build job is still running");
    }

    private void bounds(ServerLevel level, BlockPos origin, int[] size) {
        long volume = 1;
        for (int value : size) { if (value < 1 || value > 1024) throw new IllegalArgumentException("Invalid region dimensions"); volume *= value; }
        if (volume > 524288) throw new IllegalArgumentException("Split game regions into at most 524288 cells");
        if (origin.getY() < level.getMinBuildHeight() || origin.getY() + size[1] > level.getMaxBuildHeight()) throw new IllegalArgumentException("Region outside world height");
        if (!level.getWorldBorder().isWithinBounds(origin) || !level.getWorldBorder().isWithinBounds(origin.offset(size[0]-1,0,size[2]-1))) throw new IllegalArgumentException("Region outside world border");
        for (int z = origin.getZ() >> 4; z <= (origin.getZ()+size[2]-1) >> 4; z++)
            for (int x = origin.getX() >> 4; x <= (origin.getX()+size[0]-1) >> 4; x++)
                if (!level.hasChunk(x,z)) throw new IllegalArgumentException("Load target chunks in the game first");
    }

    private JsonObject read(ServerLevel level, BlockPos origin, int[] size) {
        bounds(level, origin, size);
        JsonObject result = new JsonObject(); result.addProperty("schema",1); result.addProperty("name","游戏区域 " + Instant.now());
        result.add("origin", array(origin.getX(),origin.getY(),origin.getZ())); result.add("size", array(size));
        result.addProperty("dataVersion",SharedConstants.getCurrentVersion().getDataVersion().getVersion());
        JsonArray palette = new JsonArray(), blocks = new JsonArray(); Map<BlockState,Integer> stateIds = new HashMap<>();
        for(int y=0;y<size[1];y++) for(int z=0;z<size[2];z++) for(int x=0;x<size[0];x++) {
            BlockPos at=origin.offset(x,y,z); BlockState state=level.getBlockState(at); if(state.isAir()) continue;
            if(!stateIds.containsKey(state)){ stateIds.put(state,palette.size()); palette.add(stateJson(state)); }
            JsonObject block=new JsonObject(); block.add("pos",array(x,y,z)); block.addProperty("state",stateIds.get(state));
            BlockEntity entity=level.getBlockEntity(at); if(entity!=null) block.add("nbt", tagJson(entity.saveWithFullMetadata(level.registryAccess())));
            blocks.add(block);
        }
        result.add("palette",palette);result.add("blocks",blocks);
        JsonArray entities=new JsonArray();AABB region=new AABB(origin.getX(),origin.getY(),origin.getZ(),origin.getX()+size[0],origin.getY()+size[1],origin.getZ()+size[2]);
        for(var entity:level.getEntities((net.minecraft.world.entity.Entity)null,region,e->!(e instanceof Player))){CompoundTag entityData=new CompoundTag();if(!entity.save(entityData))continue;CompoundTag wrapper=new CompoundTag();ListTag local=new ListTag(),blockPos=new ListTag();local.add(DoubleTag.valueOf(entity.getX()-origin.getX()));local.add(DoubleTag.valueOf(entity.getY()-origin.getY()));local.add(DoubleTag.valueOf(entity.getZ()-origin.getZ()));blockPos.add(IntTag.valueOf(entity.blockPosition().getX()-origin.getX()));blockPos.add(IntTag.valueOf(entity.blockPosition().getY()-origin.getY()));blockPos.add(IntTag.valueOf(entity.blockPosition().getZ()-origin.getZ()));wrapper.put("pos",local);wrapper.put("blockPos",blockPos);wrapper.put("nbt",entityData);entities.add(tagJson(wrapper));}
        result.add("entities",entities);
        JsonObject metadata=obj("sourceFormat","bridge"); metadata.addProperty("dimension",level.dimension().location().toString()); result.add("metadata",metadata);
        JsonArray warnings=new JsonArray(); warnings.add("桥接读取方块、方块实体及选区内非玩家实体（含 Create 装置）；这是服务端快照，未执行产线模拟或重建跨选区关联。"); result.add("warnings",warnings);
        return result;
    }

    private JsonObject validateProject(JsonObject project){
        JsonArray errors=new JsonArray();boolean nativeData=project.has("entities")&&!project.getAsJsonArray("entities").isEmpty();JsonObject metadata=project.has("metadata")?project.getAsJsonObject("metadata"):new JsonObject();
        nativeData|=metadata.has("nativeExtra")&&!metadata.getAsJsonObject("nativeExtra").isEmpty();boolean blockNbt=false;for(JsonElement e:project.getAsJsonArray("blocks"))if(e.getAsJsonObject().has("nbt"))blockNbt=true;
        int source=project.has("dataVersion")?project.get("dataVersion").getAsInt():0,target=SharedConstants.getCurrentVersion().getDataVersion().getVersion();
        if(nativeData)errors.add("Native entity/association data requires native schematic placement; it cannot be discarded");
        if(source!=target&&blockNbt)errors.add("Block entity NBT needs an exact DataVersion match; export a native schematic or convert it in Minecraft");
        for(JsonElement state:project.getAsJsonArray("palette")){try{parseState(state.getAsJsonObject());}catch(Exception e){if(errors.size()<20)errors.add(e.getMessage());}}
        JsonObject result=new JsonObject();result.addProperty("ok",errors.isEmpty());result.addProperty("sourceDataVersion",source);result.addProperty("targetDataVersion",target);result.addProperty("mode",source==target?"native-version":"validated-block-states");result.add("errors",errors);return result;
    }

    private JsonObject build(JsonObject body) throws Exception {
        editable(); ServerLevel level=level(body); BlockPos origin=pos(body.getAsJsonArray("origin")); JsonObject project=body.getAsJsonObject("project");
        int[] size=ints(project.getAsJsonArray("size"));bounds(level,origin,size);
        JsonObject validation=validateProject(project);if(!validation.get("ok").getAsBoolean())throw new IllegalArgumentException(validation.get("errors").toString());
        JsonObject extra=project.getAsJsonObject("metadata").has("nativeExtra")?project.getAsJsonObject("metadata").getAsJsonObject("nativeExtra"):new JsonObject();
        if(!project.getAsJsonArray("entities").isEmpty() || !extra.isEmpty()) throw new IllegalArgumentException("Native entity/association data requires Create-native schematic placement; bridge cannot discard it");
        List<BlockState> palette=new ArrayList<>();for(JsonElement s:project.getAsJsonArray("palette")) palette.add(parseState(s.getAsJsonObject()));
        Job job=new Job(level,origin); Set<BlockPos> positions=new HashSet<>();
        boolean overwrite=body.has("overwrite")&&body.get("overwrite").getAsBoolean();
        for(JsonElement item:project.getAsJsonArray("blocks")){
            JsonObject block=item.getAsJsonObject();int[] rel=ints(block.getAsJsonArray("pos"));
            for(int a=0;a<3;a++) if(rel[a]<0||rel[a]>=size[a]) throw new IllegalArgumentException("Block outside project bounds");
            BlockPos at=origin.offset(rel[0],rel[1],rel[2]); if(!positions.add(at)) throw new IllegalArgumentException("Duplicate project coordinates");
            BlockState target=palette.get(block.get("state").getAsInt()),old=level.getBlockState(at);
            if(!overwrite&&!old.isAir()) throw new IllegalArgumentException("Target contains blocks; enable overwrite or choose an empty area");
            CompoundTag nbt=block.has("nbt")?(CompoundTag)jsonTag(block.getAsJsonObject("nbt")):null;
            BlockEntity entity=level.getBlockEntity(at); CompoundTag oldNbt=entity==null?null:entity.saveWithFullMetadata(level.registryAccess());
            job.entries.add(new Entry(at,target,nbt,old,oldNbt));
        }
        persist(job); active=job; job.report.addProperty("status","queued"); jobs.put(job.id,job.report);
        while(jobs.size()>20) jobs.remove(jobs.keySet().iterator().next());
        return job.report.deepCopy();
    }

    private void persist(Job job) throws Exception {
        Path folder=gameDirectory.resolve("craftstudio-backups");Files.createDirectories(folder);
        JsonObject root=obj("dimension",job.level.dimension().location().toString());JsonArray entries=new JsonArray();
        for(Entry e:job.entries){JsonObject item=obj("state",stateJson(e.old));item.add("pos",array(e.pos.getX(),e.pos.getY(),e.pos.getZ()));if(e.oldNbt!=null)item.add("nbt",tagJson(e.oldNbt));entries.add(item);}
        root.add("entries",entries);Path file=folder.resolve(job.id+".json");Files.writeString(file,JSON.toJson(root),StandardCharsets.UTF_8);job.report.addProperty("backup",file.toString());
    }

    private JsonObject undo(){
        editable();if(previous==null)throw new IllegalArgumentException("No build snapshot in this game session");
        List<Entry> changed=previous.entries.subList(0,previous.cursor);
        for(Entry e:changed){
            if(!previous.level.getBlockState(e.pos).equals(e.target))throw new IllegalArgumentException("World changed after build; undo would overwrite edits");
            BlockEntity be=previous.level.getBlockEntity(e.pos);CompoundTag live=be==null?null:be.saveWithFullMetadata(previous.level.registryAccess());
            if(!Objects.equals(live,previous.afterNbt.get(e.pos)))throw new IllegalArgumentException("Block entity changed after build; undo would overwrite inventory or machine state");
        }
        Job job=new Job(previous.level,previous.origin);job.restoring=true;
        for(Entry e:changed)job.entries.add(new Entry(e.pos,e.old,e.oldNbt,e.target,e.nbt));
        active=job;jobs.put(job.id,job.report);return job.report.deepCopy();
    }

    public void tick(){
        if(active==null)return;Job job=active;
        try{
            job.report.addProperty("status","building");int end=Math.min(job.cursor+256,job.entries.size());
            while(job.cursor<end){
                Entry e=job.entries.get(job.cursor);
                // Detect outside edits before replacing a block; snapshot remains available.
                if(!job.level.getBlockState(e.pos).equals(e.old))throw new IllegalStateException("Target changed during build at "+e.pos);
                if(!job.level.setBlock(e.pos,e.target,Block.UPDATE_CLIENTS|Block.UPDATE_KNOWN_SHAPE)&&!job.level.getBlockState(e.pos).equals(e.target))throw new IllegalStateException("Block placement rejected at "+e.pos);
                job.cursor++; // The cell is now modified even if NBT restoration throws.
                if(e.nbt!=null){BlockEntity be=job.level.getBlockEntity(e.pos);if(be==null)throw new IllegalStateException("Missing block entity at "+e.pos);CompoundTag tag=e.nbt.copy();tag.putInt("x",e.pos.getX());tag.putInt("y",e.pos.getY());tag.putInt("z",e.pos.getZ());be.loadWithComponents(tag,job.level.registryAccess());be.setChanged();job.level.sendBlockUpdated(e.pos,e.target,e.target,Block.UPDATE_CLIENTS);}
            }
            job.report.addProperty("placed",job.cursor);
            if(job.cursor==job.entries.size()){
                long matched=job.entries.stream().filter(e->job.level.getBlockState(e.pos).equals(e.target)).count();job.report.addProperty("verifiedStates",matched);
                long expectedNbt=job.entries.stream().filter(e->e.nbt!=null).count(),matchedNbt=job.entries.stream().filter(e->{if(e.nbt==null)return false;BlockEntity be=job.level.getBlockEntity(e.pos);return be!=null&&subset(e.nbt,be.saveWithFullMetadata(job.level.registryAccess()));}).count();
                job.report.addProperty("expectedBlockEntities",expectedNbt);job.report.addProperty("verifiedBlockEntities",matchedNbt);snapshotAfter(job);
                job.report.addProperty("status",matched==job.entries.size()&&matchedNbt==expectedNbt?"completed":"verification_failed");
                job.report.addProperty("note","Verified block states and supplied block entity fields; machine behavior and neighbor physics require in-game inspection. Placed cells only; project air is not pasted.");
                if(!job.restoring)previous=job;else previous=null;active=null;
            }
        }catch(Exception exception){job.report.addProperty("status","failed");job.report.addProperty("error",exception.getMessage());job.report.addProperty("placed",job.cursor);snapshotAfter(job);if(!job.restoring)previous=job;active=null;}
    }

    private static boolean subset(Tag expected,Tag actual){
        if(expected instanceof CompoundTag a&&actual instanceof CompoundTag b){for(String key:a.getAllKeys()){if(key.equals("x")||key.equals("y")||key.equals("z"))continue;if(!b.contains(key)||!subset(a.get(key),b.get(key)))return false;}return true;}
        return Objects.equals(expected,actual);
    }
    private static void snapshotAfter(Job job){for(int i=0;i<job.cursor;i++){Entry e=job.entries.get(i);BlockEntity be=job.level.getBlockEntity(e.pos);if(be!=null)job.afterNbt.put(e.pos,be.saveWithFullMetadata(job.level.registryAccess()));}}

    private static JsonObject stateJson(BlockState state){
        JsonObject result=obj("Name",BuiltInRegistries.BLOCK.getKey(state.getBlock()).toString()),props=new JsonObject();
        for(Property<?> property:state.getProperties())props.addProperty(property.getName(),propertyName(state,property));
        if(!props.isEmpty())result.add("Properties",props);return result;
    }
    private static <T extends Comparable<T>> String propertyName(BlockState state,Property<T> property){return property.getName(state.getValue(property));}
    private static BlockState parseState(JsonObject data){
        ResourceLocation id=ResourceLocation.parse(data.get("Name").getAsString());Block block=BuiltInRegistries.BLOCK.getOptional(id).orElseThrow(()->new IllegalArgumentException("Missing block "+id));BlockState state=block.defaultBlockState();
        if(data.has("Properties"))for(var e:data.getAsJsonObject("Properties").entrySet()){Property<?> property=block.getStateDefinition().getProperty(e.getKey());if(property==null)throw new IllegalArgumentException("Invalid block property "+e.getKey());state=withProperty(state,property,e.getValue().getAsString());}
        return state;
    }
    private static <T extends Comparable<T>> BlockState withProperty(BlockState state,Property<T> property,String text){return state.setValue(property,property.getValue(text).orElseThrow(()->new IllegalArgumentException("Invalid property value "+text)));}

    private static JsonObject tagJson(Tag tag){
        JsonObject result=new JsonObject();result.addProperty("t",tag.getId());JsonElement value;
        if(tag instanceof CompoundTag c){JsonObject obj=new JsonObject();for(String k:c.getAllKeys())obj.add(k,tagJson(c.get(k)));value=obj;}
        else if(tag instanceof ListTag l){JsonArray list=new JsonArray(),values=new JsonArray();list.add(l.getElementType());for(Tag sub:l)values.add(tagJson(sub).get("v"));list.add(values);value=list;}
        else if(tag instanceof ByteArrayTag b){JsonArray a=new JsonArray();for(byte v:b.getAsByteArray())a.add(v&255);value=a;}
        else if(tag instanceof IntArrayTag b){JsonArray a=new JsonArray();for(int v:b.getAsIntArray())a.add(v);value=a;}
        else if(tag instanceof LongArrayTag b){JsonArray a=new JsonArray();for(long v:b.getAsLongArray())a.add(Long.toString(v));value=a;}
        else if(tag instanceof LongTag l)value=new JsonPrimitive(Long.toString(l.getAsLong()));
        else if(tag instanceof NumericTag n)value=new JsonPrimitive(n.getAsNumber());
        else value=new JsonPrimitive(tag.getAsString());result.add("v",value);return result;
    }
    private static Tag jsonTag(JsonObject data){
        int kind=data.get("t").getAsInt();JsonElement v=data.get("v");return switch(kind){
            case 1->ByteTag.valueOf(v.getAsByte());case 2->ShortTag.valueOf(v.getAsShort());case 3->IntTag.valueOf(v.getAsInt());case 4->LongTag.valueOf(v.getAsLong());case 5->FloatTag.valueOf(v.getAsFloat());case 6->DoubleTag.valueOf(v.getAsDouble());case 8->StringTag.valueOf(v.getAsString());
            case 7->{byte[] a=new byte[v.getAsJsonArray().size()];for(int i=0;i<a.length;i++)a[i]=(byte)v.getAsJsonArray().get(i).getAsInt();yield new ByteArrayTag(a);}
            case 11->{int[] a=new int[v.getAsJsonArray().size()];for(int i=0;i<a.length;i++)a[i]=v.getAsJsonArray().get(i).getAsInt();yield new IntArrayTag(a);}
            case 12->{long[] a=new long[v.getAsJsonArray().size()];for(int i=0;i<a.length;i++)a[i]=v.getAsJsonArray().get(i).getAsLong();yield new LongArrayTag(a);}
            case 9->{JsonArray arr=v.getAsJsonArray();int sub=arr.get(0).getAsInt();ListTag list=new ListTag();for(JsonElement item:arr.get(1).getAsJsonArray()){JsonObject child=new JsonObject();child.addProperty("t",sub);child.add("v",item);list.add(jsonTag(child));}yield list;}
            case 10->{CompoundTag c=new CompoundTag();for(var e:v.getAsJsonObject().entrySet())c.put(e.getKey(),jsonTag(e.getValue().getAsJsonObject()));yield c;}
            default->throw new IllegalArgumentException("Unsupported NBT type "+kind);
        };
    }
    private static int[] ints(JsonArray a){if(a==null||a.size()!=3)throw new IllegalArgumentException("Expected three coordinates");int[] out=new int[3];for(int i=0;i<3;i++){double v=a.get(i).getAsDouble();if(!Double.isFinite(v)||v!=Math.rint(v)||v<Integer.MIN_VALUE||v>Integer.MAX_VALUE)throw new IllegalArgumentException("Coordinates must be integers");out[i]=(int)v;}return out;}
    private static BlockPos pos(JsonArray a){int[] v=ints(a);return new BlockPos(v[0],v[1],v[2]);}
    private static JsonArray array(int... values){JsonArray a=new JsonArray();for(int v:values)a.add(v);return a;}
    private static JsonObject obj(String key,String value){JsonObject o=new JsonObject();o.addProperty(key,value);return o;}
    private static JsonObject obj(String key,JsonElement value){JsonObject o=new JsonObject();o.add(key,value);return o;}
    private record Entry(BlockPos pos,BlockState target,CompoundTag nbt,BlockState old,CompoundTag oldNbt){}
    private static final class Job{
        final String id=UUID.randomUUID().toString();final ServerLevel level;final BlockPos origin;final List<Entry> entries=new ArrayList<>();final Map<BlockPos,CompoundTag> afterNbt=new HashMap<>();final JsonObject report=new JsonObject();int cursor=0;boolean restoring=false;
        Job(ServerLevel level,BlockPos origin){this.level=level;this.origin=origin;report.addProperty("id",id);report.addProperty("status","queued");report.addProperty("placed",0);}
    }
}
