package local.craftstudio;
import net.minecraftforge.fml.common.Mod;
import net.minecraftforge.fml.loading.FMLPaths;
import net.minecraftforge.common.MinecraftForge;
import net.minecraftforge.event.server.ServerStartedEvent;
import net.minecraftforge.event.server.ServerStoppingEvent;
import net.minecraftforge.event.TickEvent;
@Mod("craftstudio")
public class ForgeBridge {
 private final BridgeRuntime bridge=new BridgeRuntime("forge");
 public ForgeBridge(){MinecraftForge.EVENT_BUS.addListener(this::start);MinecraftForge.EVENT_BUS.addListener(this::stop);MinecraftForge.EVENT_BUS.addListener(this::tick);}
 private void start(ServerStartedEvent e){bridge.start(e.getServer(),FMLPaths.CONFIGDIR.get(),FMLPaths.GAMEDIR.get());}
 private void stop(ServerStoppingEvent e){bridge.stop();}
 private void tick(TickEvent.ServerTickEvent e){if(e.phase==TickEvent.Phase.END)bridge.tick();}
}
