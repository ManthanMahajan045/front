import { Pressable, StyleSheet, Text, View } from "react-native";
import { Bell, Menu, ArrowLeft } from "lucide-react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function Header(props) {
  return (
    <SafeAreaView edges={["top"]} style={styles.safe}>
      <View style={styles.row}>
        <Pressable onPress={props.onBack || props.onMenu} style={styles.iconButton} accessibilityLabel={props.onBack ? "Go back" : "Open menu"}>
          {props.onBack ? <ArrowLeft size={21} color="#111827" /> : <Menu size={21} color="#111827" />}
        </Pressable>
        <Text style={styles.title}>{props.title || "RoadSense"}</Text>
        {props.onNotifications ? (
          <Pressable onPress={props.onNotifications} style={styles.iconButton} accessibilityLabel="Safety alerts">
            <Bell size={21} color="#111827" />
          </Pressable>
        ) : <View style={styles.iconButton} />}
      </View>
    </SafeAreaView>
  );
}
const styles = StyleSheet.create({
  safe:{backgroundColor:"#fff"},
  row:{height:58,flexDirection:"row",alignItems:"center",paddingHorizontal:16,borderBottomWidth:1,borderBottomColor:"#eef0f4"},
  iconButton:{width:40,height:40,borderRadius:20,alignItems:"center",justifyContent:"center"},
  title:{flex:1,textAlign:"center",fontSize:18,fontWeight:"800",color:"#111827"}
});
