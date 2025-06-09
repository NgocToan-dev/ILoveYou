import React, { useState, useEffect } from "react";
import { View, Linking } from "react-native";
import { NavigationContainer } from "@react-navigation/native";
import { createStackNavigator } from "@react-navigation/stack";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useTranslation } from "react-i18next";
import { onAuthStateChange } from "../services/firebase/auth";
import { LoadingIndicator, LoveBackground } from "../components";
import {
  LoginScreen,
  SignUpScreen,
  WelcomeScreen,
  HomeScreen,
  CoupleConnectionScreen,
  NotesScreen,
  CreateNoteScreen,
  EditNoteScreen,
  NotesListScreen,
  NoteDetailScreen,
  RemindersScreen,
  CreateReminderScreen,
  ReminderDetailScreen,
  EditReminderScreen,
  UserProfileScreen,
  UserListScreen,
  UserEditScreen,
  UserDeleteScreen,
  SettingsScreen,
} from "../screens";

const Stack = createStackNavigator();
const Tab = createBottomTabNavigator();

// Auth Stack Navigator
const AuthStack = () => (
  <Stack.Navigator
    screenOptions={{
      headerShown: false,
      cardStyle: { backgroundColor: "transparent" },
    }}
  >
    <Stack.Screen name="Login" component={LoginScreen} />
    <Stack.Screen name="SignUp" component={SignUpScreen} />
    <Stack.Screen name="Welcome" component={WelcomeScreen} />
  </Stack.Navigator>
);

// User Stack Navigator
const UserStack = () => {
  const { t } = useTranslation();
  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: {
          backgroundColor: "#F8BBD9",
          shadowColor: "#E91E63",
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.2,
          shadowRadius: 8,
          elevation: 5,
        },
        headerTintColor: "#C2185B",
        headerTitleStyle: {
          fontWeight: "bold",
          fontSize: 18,
        },
        cardStyle: { backgroundColor: "transparent" },
      }}
    >
      <Stack.Screen
        name="UserProfile"
        component={UserProfileScreen}
        options={{ title: t('navigation.headers.myProfile') }}
      />
      <Stack.Screen
        name="UserList"
        component={UserListScreen}
        options={{ title: t('navigation.headers.userList') }}
      />
      <Stack.Screen
        name="UserEdit"
        component={UserEditScreen}
        options={{ title: t('navigation.headers.editProfile') }}
      />
      <Stack.Screen
        name="UserDelete"
        component={UserDeleteScreen}
        options={{
          title: t('navigation.headers.deleteAccount'),
          headerStyle: {
            backgroundColor: "#FFB6B6",
          },
        }}
      />
    </Stack.Navigator>
  );
};

// Settings Stack Navigator
const SettingsStack = () => {
  const { t } = useTranslation();
  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: {
          backgroundColor: "#F8BBD9",
          shadowColor: "#E91E63",
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.2,
          shadowRadius: 8,
          elevation: 5,
        },
        headerTintColor: "#C2185B",
        headerTitleStyle: {
          fontWeight: "bold",
          fontSize: 18,
        },
        cardStyle: { backgroundColor: "transparent" },
      }}
    >
      <Stack.Screen
        name="SettingsMain"
        component={SettingsScreen}
        options={{ title: t('navigation.headers.settings') }}
      />
    </Stack.Navigator>
  );
};

// Notes Stack Navigator
const NotesStack = () => {
  const { t } = useTranslation();
  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: {
          backgroundColor: "#F8BBD9",
          shadowColor: "#E91E63",
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.2,
          shadowRadius: 8,
          elevation: 5,
        },
        headerTintColor: "#C2185B",
        headerTitleStyle: {
          fontWeight: "bold",
          fontSize: 18,
        },
        cardStyle: { backgroundColor: "transparent" },
      }}
    >
      <Stack.Screen
        name="NotesMain"
        component={NotesScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="CreateNote"
        component={CreateNoteScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="EditNote"
        component={EditNoteScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="NotesList"
        component={NotesListScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="NoteDetail"
        component={NoteDetailScreen}
        options={{ headerShown: false }}
      />
    </Stack.Navigator>
  );
};

// Reminders Stack Navigator
const RemindersStack = () => {
  const { t } = useTranslation();
  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: {
          backgroundColor: "#F8BBD9",
          shadowColor: "#E91E63",
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.2,
          shadowRadius: 8,
          elevation: 5,
        },
        headerTintColor: "#C2185B",
        headerTitleStyle: {
          fontWeight: "bold",
          fontSize: 18,
        },
        cardStyle: { backgroundColor: "transparent" },
      }}
    >
      <Stack.Screen
        name="RemindersMain"
        component={RemindersScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="CreateReminder"
        component={CreateReminderScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="ReminderDetail"
        component={ReminderDetailScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="EditReminder"
        component={EditReminderScreen}
        options={{ headerShown: false }}
      />
    </Stack.Navigator>
  );
};

// Home Stack Navigator
const HomeStack = () => {
  const { t } = useTranslation();
  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: {
          backgroundColor: "#F8BBD9",
          shadowColor: "#E91E63",
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.2,
          shadowRadius: 8,
          elevation: 5,
        },
        headerTintColor: "#C2185B",
        headerTitleStyle: {
          fontWeight: "bold",
          fontSize: 18,
        },
        cardStyle: { backgroundColor: "transparent" },
      }}
    >
      <Stack.Screen
        name="HomeMain"
        component={HomeScreen}
        options={{ headerShown: false }}
      />
    </Stack.Navigator>
  );
};

// Main Tab Navigator
const MainTabs = () => {
  const { t } = useTranslation();
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName;

          if (route.name === "Home") {
            iconName = focused ? "home" : "home-outline";
          } else if (route.name === "Profile") {
            iconName = focused ? "person" : "person-outline";
          } else if (route.name === "Couple") {
            iconName = focused ? "heart" : "heart-outline";
          } else if (route.name === "Notes") {
            iconName = focused ? "document-text" : "document-text-outline";
          } else if (route.name === "Reminders") {
            iconName = focused ? "alarm" : "alarm-outline";
          }

          return <Ionicons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: "#E91E63",
        tabBarInactiveTintColor: "#F8BBD9",
        tabBarStyle: {
          backgroundColor: "#FFF",
          borderTopColor: "#F8BBD9",
          borderTopWidth: 1,
          paddingBottom: 5,
          paddingTop: 5,
          height: 60,
          shadowColor: "#E91E63",
          shadowOffset: { width: 0, height: -2 },
          shadowOpacity: 0.15,
          shadowRadius: 8,
          elevation: 10,
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: "600",
        },
        headerShown: false,
      })}
    >
      <Tab.Screen
        name="Home"
        component={HomeStack}
        options={{ tabBarLabel: 'Trang chủ' }}
      />
      <Tab.Screen
        name="Couple"
        component={CoupleConnectionScreen}
        options={{ tabBarLabel: 'Kết nối' }}
      />
      <Tab.Screen
        name="Notes"
        component={NotesStack}
        options={{ tabBarLabel: 'Ghi chú' }}
      />
      <Tab.Screen
        name="Reminders"
        component={RemindersStack}
        options={{ tabBarLabel: 'Nhắc nhở' }}
      />
      <Tab.Screen
        name="Profile"
        component={UserStack}
        options={{ tabBarLabel: 'Cá nhân' }}
      />
    </Tab.Navigator>
  );
};

// Navigation persistence key
const PERSISTENCE_KEY = "NAVIGATION_STATE_V1";

// Linking configuration for deep links
const linking = {
  prefixes: ["iloveyou://"],
  config: {
    screens: {
      Auth: {
        screens: {
          Login: "login",
          SignUp: "signup",
          Welcome: "welcome",
        },
      },
      Main: {
        screens: {
          Home: {
            screens: {
              HomeMain: "home",
            },
          },
          Couple: "couple",
          Notes: {
            screens: {
              NotesMain: "notes",
            },
          },
          Reminders: {
            screens: {
              RemindersMain: "reminders",
            },
          },          Profile: {
            screens: {
              UserProfile: "profile",
              UserList: "profile/users",
              UserEdit: "profile/edit",
              UserDelete: "profile/delete",
            },
          },
        },
      },
    },
  },
};

// Main App Navigator
const AppNavigator = () => {
  const { t } = useTranslation();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isReady, setIsReady] = useState(false);
  const [initialState, setInitialState] = useState();

  useEffect(() => {
    const restoreState = async () => {
      try {
        const initialUrl = await Linking.getInitialURL();

        if (initialUrl == null) {
          // Only restore state if there's no deep link
          const savedStateString = await AsyncStorage.getItem(PERSISTENCE_KEY);
          const state = savedStateString
            ? JSON.parse(savedStateString)
            : undefined;

          if (state !== undefined) {
            setInitialState(state);
          }
        }
      } finally {
        setIsReady(true);
      }
    };

    if (!isReady) {
      restoreState();
    }
  }, [isReady]);

  useEffect(() => {
    const unsubscribe = onAuthStateChange((authUser) => {
      setUser(authUser);
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  if (!isReady || loading) {
    return (
      <LoveBackground>
        <View
          style={{ flex: 1, justifyContent: "center", alignItems: "center" }}
        >
          <LoadingIndicator message={t('common.loading')} size="large" />
        </View>
      </LoveBackground>
    );
  }
  return (
    <NavigationContainer
      linking={linking}
      initialState={initialState}
      onStateChange={(state) =>
        AsyncStorage.setItem(PERSISTENCE_KEY, JSON.stringify(state))
      }
    >
      {user ? <MainTabs /> : <AuthStack />}
    </NavigationContainer>
  );
};

export default AppNavigator;
