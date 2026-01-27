import React from 'react';
import { View, StyleSheet, StatusBar } from 'react-native';
import { WebView } from 'react-native-webview';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from './ThemeContext';

const WebViewScreen = ({ route }) => {
    const { url } = route.params;
    const insets = useSafeAreaInsets();
    const { isDarkMode } = useTheme();

    return (
        <View style={[styles.container, { backgroundColor: isDarkMode ? '#000' : '#fff' }]}>
            <StatusBar
                barStyle={isDarkMode ? "light-content" : "dark-content"}
                backgroundColor="transparent"
                translucent={true}
            />
            <View style={{ flex: 1, marginTop: insets.top }}>
                <WebView
                    source={{ uri: url }}
                    style={styles.webview}
                    startInLoadingState={true}
                    scalesPageToFit={true}
                />
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    webview: {
        flex: 1,
    },
});

export default WebViewScreen;
