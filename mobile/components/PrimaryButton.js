import { ActivityIndicator, Pressable, StyleSheet, Text } from "react-native";
export default function PrimaryButton(props) {
  return <Pressable disabled={props.loading || props.disabled} onPress={props.onPress} style={[styles.button,(props.loading||props.disabled)&&styles.disabled,props.secondary&&styles.secondary]}>{props.loading?<ActivityIndicator color={props.secondary?"#6d28d9":"#fff"}/>:<Text style={[styles.text,props.secondary&&styles.secondaryText]}>{props.children}</Text>}</Pressable>;
}
const styles=StyleSheet.create({
 button:{minHeight:50,borderRadius:14,backgroundColor:"#6d28d9",alignItems:"center",justifyContent:"center",paddingHorizontal:18},
 disabled:{opacity:.55},
 secondary:{backgroundColor:"#fff",borderWidth:1,borderColor:"#d8dbe3"},
 text:{color:"#fff",fontSize:15,fontWeight:"800"},
 secondaryText:{color:"#6d28d9"}
});
