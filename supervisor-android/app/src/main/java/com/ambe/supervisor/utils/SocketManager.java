package com.ambe.supervisor.utils;

import android.util.Log;
import io.socket.client.IO;
import io.socket.client.Socket;
import io.socket.emitter.Emitter;

public class SocketManager {
    private static SocketManager instance;
    private Socket mSocket;

    private SocketManager() {
        try {
            IO.Options options = new IO.Options();
            // FORCE WEBSOCKET: Prevents "polling" issues that cause disconnect loops on Android
            options.transports = new String[]{"websocket"}; 
            options.forceNew = true; // Force new connection instance
            options.reconnection = true;
            options.reconnectionDelay = 1000;
            options.reconnectionDelayMax = 5000;
            options.reconnectionAttempts = 99999;
            // options.upgrade = false; // Not needed if we force websocket

            mSocket = IO.socket(AppConfig.getBaseUrl(), options);
            
            mSocket.on(Socket.EVENT_CONNECT_ERROR, new Emitter.Listener() {
                @Override
                public void call(Object... args) {
                    if (args.length > 0 && args[0] instanceof Exception) {
                        Log.e("SocketManager", "Connect Error: " + ((Exception) args[0]).getMessage());
                    } else {
                        Log.e("SocketManager", "Connect Error: " + args[0]);
                    }
                }
            });
        } catch (Exception e) {
            e.printStackTrace();
        }
    }

    public static synchronized SocketManager getInstance() {
        if (instance == null) {
            instance = new SocketManager();
        }
        return instance;
    }

    public Socket getSocket() {
        return mSocket;
    }

    public void connect() {
        if (mSocket != null && !mSocket.connected()) {
            mSocket.connect();
        }
    }

    public void disconnect() {
        if (mSocket != null && mSocket.connected()) {
            mSocket.disconnect();
        }
    }

    public boolean isConnected() {
        return mSocket != null && mSocket.connected();
    }
}
