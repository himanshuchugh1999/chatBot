import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import ChatBotScreen from './src/screens/ChatBotScreen';

const Tab = createBottomTabNavigator();

const App = () => {
  return (
    <NavigationContainer>
      <Tab.Navigator screenOptions={{ headerShown: false }}>
        <Tab.Screen name="ChatBot" component={ChatBotScreen} />
      </Tab.Navigator>
    </NavigationContainer>
  );
};
export default App;
