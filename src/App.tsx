import { Image, StyleSheet, TouchableWithoutFeedback, View } from 'react-native';
import {
  getFocusedRouteNameFromRoute,
  NavigationContainer,
} from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import {
  About,
  Account,
  ActiveProducts,
  AppSettings,
  AuthHome,
  BrowserScreen,
  Business,
  BusinessSetup,
  BusinessSetup2,
  CreateBill,
  HelpAndSupport,
  Home,
  Invoice,
  InvoiceDetails,
  ItemMaster,
  Login,
  OfflineScreen,
  Onboarding,
  OtpVerify,
  PrinterSetup,
  Product,
  SalesReport,
  Settings,
  Subscription,
  Transaction,
} from './Screens';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { fonts } from './utils/fonts';
import { colors } from './utils/colors';
import { memo, useCallback, useEffect, useMemo } from 'react';
import { font, icon, margin, padding } from './utils/responsive';
import AuthProvider, { useAuth, useUser } from './Contexts/AuthContext';
import ProductProvider from './Contexts/ProductContexts';
import { ToastContainer } from './Components';
import PrinterProvider from './Contexts/PrinterContext';
import { requestNotificationPermission } from './utils/permissionHelper';
import { notificationService } from './utils/NotificationService';
import { AppSettingProvider } from './Contexts/AppSettingContexts';
import NetworkProvider, { useNetworkContext } from './Contexts/NetworkContext';
import InvoiceProvider from './Contexts/InvoiceContext';
import SocketProvider from './Contexts/SocketContext';
import { SafeAreaProvider, useSafeAreaInsets } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

// import { GestureHandlerRootView } from 'react-native-gesture-handler';

const icons = {
  Home: require('./../asset/images/hometab.png'),
  Invoice: require('./../asset/images/invoicetab.png'),
  CreateBill: require('./../asset/images/createtab.png'),
  Product: require('./../asset/images/producttab.png'),
  Account: require('./../asset/images/accounttab.png'),
};

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

const AuthStack = memo(() => {
  return (
    <Stack.Navigator
      initialRouteName="Onboarding"
      screenOptions={{
        headerShown: false,
        animation: 'slide_from_right',
      }}>
      <Stack.Screen name="Onboarding" component={Onboarding} />
      <Stack.Screen name="AuthHome" component={AuthHome} />
      <Stack.Screen name="Login" component={Login} />
      <Stack.Screen name="Otp" component={OtpVerify} />
    </Stack.Navigator>
  );
});

const BusinessStack = () => {
  return <Stack.Navigator initialRouteName='BusinessSetup' screenOptions={{
    headerShown: false
  }}>
    <Stack.Screen name="BusinessSetup" component={BusinessSetup} />
    <Stack.Screen name="BusinessSetup2" component={BusinessSetup2} />
  </Stack.Navigator>
}

const HomeStack = memo(() => {
  // const businessId = useUser('businessId');
  return (
    <Stack.Navigator
      initialRouteName={'Home'}
      screenOptions={{
        headerShown: false,
        animation: 'slide_from_right',
      }}>
      <Stack.Screen name="Home" component={Home} />
      <Stack.Screen name="Business" component={Business} />
      <Stack.Screen
        name="InvoiceDetails"
        component={InvoiceDetails}
        options={{
          animation: 'slide_from_bottom',
          animationDuration: 200,
        }}
      />

    </Stack.Navigator>
  );
});

const InvoiceStack = memo(() => {
  return (
    <Stack.Navigator
      initialRouteName="Invoice"
      screenOptions={{
        headerShown: false,
        animation: 'slide_from_right',
      }}>
      <Stack.Screen name="Invoice" component={Invoice} />
      <Stack.Screen
        name="InvoiceDetails"
        component={InvoiceDetails}
        options={{
          animation: 'slide_from_bottom',
          animationDuration: 200,
        }}
      />
    </Stack.Navigator>
  );
});

const SettingStack = memo(() => (
  <Stack.Navigator
    initialRouteName="Settings"
    screenOptions={{
      headerShown: false,
    }}>
    <Stack.Screen name="Settings" component={Settings} />
    <Stack.Screen name="PrinterSetup" component={PrinterSetup} />
    <Stack.Screen name="AppSettings" component={AppSettings} />
  </Stack.Navigator>
));

const AccountStack = memo(() => {
  return (
    <Stack.Navigator
      initialRouteName="Account"
      screenOptions={{
        headerShown: false,
        animation: 'slide_from_right',
      }}>
      <Stack.Screen name="Account" component={Account} />
      <Stack.Screen name="Subscription" component={Subscription} />
      <Stack.Screen name="HelpAndSupport" component={HelpAndSupport} />
      <Stack.Screen name="About" component={About} />
      <Stack.Screen name="SalesAndReport" component={SalesReport} />
      <Stack.Screen name="ItemMaster" component={ItemMaster} />
      <Stack.Screen name="Browser" component={BrowserScreen} />
      <Stack.Screen name="Settings" component={SettingStack} />
      <Stack.Screen name="ActiveProducts" component={ActiveProducts} />
      <Stack.Screen name="Transaction" component={Transaction} />
    </Stack.Navigator>
  );
});

const AppStack = memo(() => {
  const renderTabIcon = useCallback(
    iconSource =>
      ({ focused, color }) =>
      (
        <Image
          source={iconSource}
          style={[styles.tabbarIcon, { tintColor: focused ? color : 'gray' }]}
          resizeMode="contain"
        />
      ),
    [],
  );

  const inset = useSafeAreaInsets()
  const businessId = useUser('businessId')

  const defaultTabBarStyle = useMemo(() => ({
    height: 85 + inset.bottom,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: padding(10),
  }), [inset.bottom]);

  const isOnline = useNetworkContext("isOnline")
  if (!isOnline) {
    return <OfflineScreen />
  }

  const HiddenTabBarButton = () => null;


  return (
    <Tab.Navigator
      initialRouteName={businessId ? "Home" : "BusinessSetup"}
      screenOptions={{
        headerShown: false,
        tabBarHideOnKeyboard: true,
        lazy: true,
        animation: 'shift',
        tabBarStyle: defaultTabBarStyle,
        tabBarLabelStyle: {
          fontSize: font(12),
          fontFamily: fonts.onMedium,
          // marginTop: 1,
        },
        tabBarItemStyle: {
          justifyContent: 'center',
          alignItems: 'center',
        },
        tabBarActiveTintColor: colors.primary,
        tabBarButton: props => (
          <TouchableWithoutFeedback onPress={props.onPress}>
            <View {...props} />
          </TouchableWithoutFeedback>
        ),
      }}>
      <Tab.Screen
        name="Home"
        component={HomeStack}
        options={{
          tabBarIcon: renderTabIcon(icons.Home),
        }}
      />
      <Tab.Screen
        name="Product"
        component={Product}
        options={{
          tabBarIcon: renderTabIcon(icons.Product),
        }}
      />
      <Tab.Screen
        name="Create"
        component={CreateBill}
        options={{
          tabBarStyle: {
            display: 'none',
          },
          tabBarIcon: ({ focused, color }) => (
            <View style={styles.createTabParent}>
              <Image
                source={icons.CreateBill}
                style={[styles.tabbarIcon, { tintColor: '#fff' }]}
                resizeMode="contain"
              />
            </View>
          ),
          tabBarLabel: '',
          tabBarLabelStyle: { display: 'none' },
        }}
      />
      <Tab.Screen
        name="Invoice"
        component={InvoiceStack}
        // options={({ route }) => {
        //   const routeName = getFocusedRouteNameFromRoute(route) ?? 'Invoice';
        //   return {
        //     tabBarIcon: renderTabIcon(icons.Invoice),
        //     tabBarStyle:
        //       routeName === 'InvoiceDetails'
        //         ? {
        //           display: 'none',
        //         }
        //         : defaultTabBarStyle,
        //   };
        // }}
        options={({ route }) => {
          return {
            tabBarIcon: renderTabIcon(icons.Invoice),
            tabBarStyle: defaultTabBarStyle,
          };
        }}
      />
      <Tab.Screen
        name="Account"
        component={AccountStack}
        options={({ route }) => {
          const routeName = getFocusedRouteNameFromRoute(route) ?? 'Account';
          return {
            tabBarIcon: renderTabIcon(icons.Account),
            tabBarStyle:
              routeName === 'Settings' ? { display: 'none' } : defaultTabBarStyle,
          };
        }}
      />
      <Tab.Screen
        name="BusinessSetup"
        component={BusinessStack}
        options={{
          tabBarButton: HiddenTabBarButton,
          tabBarItemStyle: { display: 'none' },
          tabBarLabel: () => null,
          tabBarIcon: () => null,
          tabBarStyle: { display: 'none' },
        }}
      />
    </Tab.Navigator>
  );
});

const AppNav = () => {
  const { authToken } = useAuth();

  useEffect(() => {
    if (authToken) {
      const request = async () => {
        const result = await requestNotificationPermission();
        if (result) {
          notificationService.init();
        }
      }
      setTimeout(() => {
        request();
      }, 300);
    }
  }, [authToken])

  if (!authToken) {
    return <AuthStack />;
  }
  return <AppStack />;
};
const App = () => {
  return (
    <NetworkProvider>
      <AuthProvider>
        <AppSettingProvider>
          <ProductProvider>
            <InvoiceProvider>
              <PrinterProvider>
                <SocketProvider>
                  <SafeAreaProvider>
                    <NavigationContainer>
                      <AppNav />
                      <ToastContainer />
                    </NavigationContainer>
                  </SafeAreaProvider>
                </SocketProvider>
              </PrinterProvider>
            </InvoiceProvider>
          </ProductProvider>
        </AppSettingProvider>
      </AuthProvider >
    </NetworkProvider>
  );
};

export default memo(App);

const styles = StyleSheet.create({
  tabbarIcon: {
    width: icon(22),
    height: icon(22),
  },
  createTabParent: {
    backgroundColor: colors.primary,
    width: 50,
    height: 50,
    borderRadius: 50 / 2,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: margin(10),
  },
});
