import { CameraView, useCameraPermissions } from "expo-camera";
import { router } from "expo-router";
import { useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { useTranslation } from "react-i18next";

export default function QRScannerScreen() {
  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);

  const { t } = useTranslation();

  if (!permission) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  if (!permission.granted) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>{t("qrScanner.cameraAccess")}</Text>

        <Text style={styles.description}>
          {t("qrScanner.cameraDescription")}
        </Text>

        <Pressable style={styles.button} onPress={requestPermission}>
          <Text style={styles.buttonText}>{t("qrScanner.allowCamera")}</Text>
        </Pressable>
      </View>
    );
  }

  const handleBarcodeScanned = ({ data }: { data: string }) => {
    if (scanned) return;

    const prefix = "near://user/";

    if (!data.startsWith(prefix)) {
      return;
    }

    const userId = data.slice(prefix.length);

    if (!userId) return;

    setScanned(true);

    router.replace({
      pathname: "/user/[id]",
      params: { id: userId },
    });
  };

  return (
    <View style={styles.cameraContainer}>
      <CameraView
        style={StyleSheet.absoluteFill}
        facing="back"
        barcodeScannerSettings={{
          barcodeTypes: ["qr"],
        }}
        onBarcodeScanned={scanned ? undefined : handleBarcodeScanned}
      />

      <View style={styles.overlay}>
        <Text style={styles.scanText}>{t("qrScanner.scanInstruction")}</Text>

        <View style={styles.scanBox} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 30,
    backgroundColor: "#000",
  },

  title: {
    fontSize: 24,
    fontWeight: "600",
    color: "#fff",
    marginBottom: 12,
  },

  description: {
    color: "#aaa",
    textAlign: "center",
    marginBottom: 24,
  },

  button: {
    backgroundColor: "#fff",
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 14,
  },

  buttonText: {
    color: "#000",
    fontWeight: "600",
  },

  cameraContainer: {
    flex: 1,
    backgroundColor: "#000",
  },

  overlay: {
    ...StyleSheet.absoluteFill,
    justifyContent: "center",
    alignItems: "center",
  },

  scanText: {
    position: "absolute",
    top: 80,
    color: "#fff",
    fontSize: 18,
    fontWeight: "600",
  },

  scanBox: {
    width: 260,
    height: 260,
    borderWidth: 3,
    borderColor: "#fff",
    borderRadius: 24,
  },
});