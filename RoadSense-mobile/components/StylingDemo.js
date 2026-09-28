import { Text, View } from "react-native";

export default function StylingDemo() {
  return (
    <View className="rounded-xl bg-white p-4">
      <Text className="text-base font-semibold text-slate-900">Hazard detected</Text>
      <Text className="mt-1 text-sm text-slate-500">NativeWind styling is active.</Text>
    </View>
  );
}
