import { useTheme } from '@/hooks/useTheme';
import { Tabs } from 'expo-router';
import { Droplets, MapPin, User } from 'lucide-react-native';
export default function TabLayout() {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const t = (light: string, dark: string) => (isDark ? dark : light);

  return (
    // <AuthGate>
    // {/* </AuthGate> */}
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: t('#FFFFFF', '#1F2937'),
          borderTopWidth: 1,
          borderTopColor: t('#E5E7EB', '#374151'),
          height: 70,
          paddingBottom: 8,
          paddingTop: 8,
        },
        tabBarActiveTintColor: t('#2F80ED', '#60A5FA'),
        tabBarInactiveTintColor: t('#9CA3AF', '#9CA3AF'),
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '600',
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Mananciais',
          tabBarIcon: ({ size, color }) => (
            <Droplets size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="map"
        options={{
          title: 'Mapa',
          tabBarIcon: ({ size, color }) => <MapPin size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Perfil',
          tabBarIcon: ({ size, color }) => <User size={size} color={color} />,
        }}
      />
    </Tabs>
  );
}