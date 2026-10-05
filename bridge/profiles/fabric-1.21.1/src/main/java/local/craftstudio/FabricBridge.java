package local.craftstudio;
import net.fabricmc.api.ModInitializer;
import net.fabricmc.loader.api.FabricLoader;
import net.fabricmc.fabric.api.event.lifecycle.v1.ServerLifecycleEvents;
import net.fabricmc.fabric.api.event.lifecycle.v1.ServerTickEvents;
public class FabricBridge implements ModInitializer {
 private final BridgeRuntime bridge=new BridgeRuntime("fabric");
 public void onInitialize(){ServerLifecycleEvents.SERVER_STARTED.register(s->bridge.start(s,FabricLoader.getInstance().getConfigDir(),FabricLoader.getInstance().getGameDir()));ServerLifecycleEvents.SERVER_STOPPING.register(s->bridge.stop());ServerTickEvents.END_SERVER_TICK.register(s->bridge.tick());}
}
