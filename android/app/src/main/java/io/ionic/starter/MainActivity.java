package io.ionic.starter;

import android.os.Bundle;
import android.webkit.*;
import android.net.http.SslError;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
    }

    @Override
    public void onStart() {
        super.onStart();
        // Bypass SSL errors for local IP testing
        if (getBridge() != null && getBridge().getWebView() != null) {
            getBridge().getWebView().setWebViewClient(new com.getcapacitor.BridgeWebViewClient(getBridge()) {
                @Override
                public void onReceivedSslError(WebView view, SslErrorHandler handler,
                        SslError error) {
                    // Ignore SSL errors for our specific IP
                    if (error.getUrl() != null && error.getUrl().contains("103.243.232.204")) {
                        handler.proceed();
                    } else {
                        super.onReceivedSslError(view, handler, error);
                    }
                }
            });
        }
    }

}
