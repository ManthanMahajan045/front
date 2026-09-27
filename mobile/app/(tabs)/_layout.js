import { Tabs, useRouter } from "expo-router";
import { useEffect } from "react";
import { Home, FileText, Bell, User } from "lucide-react-native";

export default function TabsLayout() {
  const router = useRouter();
  return (
    <Tabs screenOptions={{
      headerShown:false,
      tabBarActiveTintColor:"#6d28d9",
      tabBarInactiveTintColor:"#6b7280",
      tabBarLabelStyle:{fontSize:11,fontWeight:"700"},
      tabBarStyle:{height:70,paddingBottom:8,paddingTop:5}
    }}>
      <Tabs.Screen name="index" options={{title:"Home",tabBarIcon:function(p){return <Home size={21} color={p.color}/>;}}}/>
      <Tabs.Screen name="reports" options={{title:"Reports",tabBarIcon:function(p){return <FileText size={21} color={p.color}/>;}}}/>
      <Tabs.Screen name="alerts" options={{title:"Alerts",tabBarIcon:function(p){return <Bell size={21} color={p.color}/>;}}}/>
      <Tabs.Screen name="profile" options={{title:"Profile",tabBarIcon:function(p){return <User size={21} color={p.color}/>;}}}/>
    </Tabs>
  );
}
