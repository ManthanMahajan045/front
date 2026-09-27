import { StyleSheet, View } from "react-native";
export default function Screen(props) {
  return <View style={[styles.screen, props.center && styles.center, props.style]}>{props.children}</View>;
}
const styles=StyleSheet.create({screen:{flex:1,backgroundColor:"#f8fafc"},center:{alignItems:"center",justifyContent:"center"}});
