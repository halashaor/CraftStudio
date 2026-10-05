package local.craftstudio;
import net.neoforged.fml.common.Mod;
import net.neoforged.fml.loading.FMLPaths;
import net.neoforged.neoforge.common.NeoForge;
import net.neoforged.neoforge.event.server.ServerStartedEvent;
import net.neoforged.neoforge.event.server.ServerStoppingEvent;
import net.neoforged.neoforge.event.tick.ServerTickEvent;
@Mod("craftstudio")
public class CraftStudioBridge {
 private final BridgeRuntime bridge=new BridgeRuntime("neoforge");
 public CraftStudioBridge(){NeoForge.EVENT_BUS.addListener(this::start);NeoForge.EVENT_BUS.addListener(this::stop);NeoForge.EVENT_BUS.addListener(this::tick);}
 private void start(ServerStartedEvent e){bridge.start(e.getServer(),FMLPaths.CONFIGDIR.get(),FMLPaths.GAMEDIR.get());}
 private void stop(ServerStoppingEvent e){bridge.stop();}
 private void tick(ServerTickEvent.Post e){bridge.tick();}
}
