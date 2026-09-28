import { useState } from "react";
import { Alert, Image, Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import * as ImagePicker from "expo-image-picker";
import { Camera, ImagePlus, Send } from "lucide-react-native";
import { submitHazard } from "../services/hazards";

export default function HazardReportForm({ location, reportedBy = null }) {
  const [description, setDescription] = useState("");
  const [photoUri, setPhotoUri] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  async function pickImage() {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert("Photo permission needed", "Allow photo-library access to attach a hazard photo.");
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsEditing: true,
      quality: 0.7
    });
    if (!result.canceled) setPhotoUri(result.assets[0].uri);
  }

  async function submit() {
    if (!description.trim()) {
      Alert.alert("Missing description", "Please describe the hazard first.");
      return;
    }
    if (!location) {
      Alert.alert("Location needed", "Set your phone location before submitting the report.");
      return;
    }

    setSubmitting(true);
    try {
      await submitHazard({ description, photoUri, location, reportedBy });
      setDescription("");
      setPhotoUri(null);
      Alert.alert("Report submitted", "Your hazard report was submitted successfully.");
    } catch (error) {
      Alert.alert("Report failed", error?.message || "Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <View style={styles.card}>
      <Text style={styles.title}>Report a hazard</Text>
      <TextInput
        value={description}
        onChangeText={setDescription}
        placeholder="Describe the hazard"
        multiline
        textAlignVertical="top"
        style={styles.input}
      />
      {photoUri ? (
        <Image source={{ uri: photoUri }} style={styles.preview} />
      ) : (
        <Pressable onPress={pickImage} style={styles.photoButton}>
          <ImagePlus size={20} color="#17202A" />
          <Text style={styles.photoText}>Choose photo</Text>
        </Pressable>
      )}
      <Pressable onPress={submit} disabled={submitting} style={({ pressed }) => [styles.submit, pressed && styles.pressed]}>
        <Send size={18} color="#FFFFFF" />
        <Text style={styles.submitText}>{submitting ? "Submitting…" : "Submit report"}</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { backgroundColor: "#FFFFFF", borderRadius: 20, padding: 20, borderWidth: 1, borderColor: "#E2E7EB", gap: 14 },
  title: { fontSize: 19, fontWeight: "800", color: "#17202A" },
  input: { minHeight: 110, borderWidth: 1, borderColor: "#CDD5DB", borderRadius: 12, padding: 12, fontSize: 15, color: "#17202A" },
  photoButton: { minHeight: 48, borderRadius: 12, borderWidth: 1, borderColor: "#CDD5DB", flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8 },
  photoText: { fontSize: 15, fontWeight: "700", color: "#17202A" },
  preview: { width: "100%", height: 190, borderRadius: 12 },
  submit: { minHeight: 48, borderRadius: 12, backgroundColor: "#B03A2E", flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8 },
  submitText: { color: "#FFFFFF", fontSize: 15, fontWeight: "800" },
  pressed: { opacity: 0.82 }
});
