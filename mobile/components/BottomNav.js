import { Pressable, StyleSheet, Text, View } from "react-native";
import { Home, FileText, Bell, User } from "lucide-react-native";

const tabs = [
  ["index","Home",Home],
  ["reports","Reports",FileText],
  ["alerts","Alerts",Bell],
  ["profile","Profile",User]
];

export default function BottomNav(props) {
  return (
    <View style={styles.bar}>
      {tabs.map(function (item) {
        const Icon = item[2];
        const active = props.active === item[0];
        return (
          <Pressable key={item[0]} onPress={function(){props.onNavigate(item[0]);}} style={styles.item}>
            <View style={[styles.iconWrap, active && styles.activeIcon]}>
              <Icon size={20} color={active ? "#6d28d9" : "#6b7280"} strokeWidth={active ? 2.5 : 1.8}/>
            </View>
            <Text style={[styles.label, active && styles.activeLabel]}>{item[1]}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}
const styles=StyleSheet.create({
  bar:{height:72,backgroundColor:"#fff",borderTopWidth:1,borderTopColor:"#e5e7eb",flexDirection:"row",paddingBottom:8},
  item:{flex:1,alignItems:"center",justifyContent:"center",gap:2},
  iconWrap:{width:38,height:30,alignItems:"center",justifyContent:"center",borderRadius:16},
  activeIcon:{backgroundColor:"#f0e9ff"},
  label:{fontSize:11,color:"#6b7280",fontWeight:"600"},
  activeLabel:{color:"#6d28d9",fontWeight:"800"}
});
