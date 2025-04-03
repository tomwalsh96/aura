// Mock expo-router
jest.mock('expo-router', () => ({
  useLocalSearchParams: jest.fn(() => ({})), // Return an object by default
  router: {
    push: jest.fn(),
    replace: jest.fn(),
    back: jest.fn(),
  },
}));

// Mock firebase libraries
jest.mock('firebase/firestore', () => ({
  doc: jest.fn(),
  onSnapshot: jest.fn(() => jest.fn()), // Mock onSnapshot to return an unsubscribe function
  collection: jest.fn(),
  getDocs: jest.fn(() => Promise.resolve({ docs: [] })),
  addDoc: jest.fn(() => Promise.resolve()),
  updateDoc: jest.fn(() => Promise.resolve()),
  // Add other firestore functions used (query, where, orderBy, etc.)
}));

// Mock your firebase config helper
jest.mock('firebase-config', () => ({
  db: {}, // Assuming it exports a db object
  // Add other exports if necessary
}));

// Mock @expo/vector-icons
// Return a simple string or component mock for each icon set you use
jest.mock('@expo/vector-icons', () => ({
  Ionicons: 'Icon',
  MaterialIcons: 'Icon',
  // Add other icon sets used (FontAwesome, etc.)
}));

// Mock AsyncStorage
jest.mock('@react-native-async-storage/async-storage', () => ({
  setItem: jest.fn(() => Promise.resolve()),
  getItem: jest.fn(() => Promise.resolve(null)), // Default to returning null
  removeItem: jest.fn(() => Promise.resolve()),
  clear: jest.fn(() => Promise.resolve()),
}));

// Mock react-native-get-random-values explicitly
jest.mock('react-native-get-random-values', () => ({
    getRandomBase64: jest.fn((byteCount) => 'mockRandomBase64String'.repeat(byteCount)),
}));

// Mock react-native
jest.mock('react-native', () => {
  // Use requireActual to get the real react-native implementation
  const RN = jest.requireActual('react-native');

  // --- Mock specific NativeModules needed ---

  // Mock for SettingsManager (to fix initial error and getConstants error)
  RN.NativeModules.SettingsManager = {
    settings: {},
    getSettings: jest.fn(() => Promise.resolve({})),
    setSettings: jest.fn(() => Promise.resolve()),
    deleteSettings: jest.fn(() => Promise.resolve()),
    getConstants: jest.fn(() => ({ // Needed by Settings.ios.js initialization
      settings: {},
    })),
  };

  // Mock for react-native-get-random-values native part
  RN.NativeModules.RNGetRandomValues = {
    getRandomBase64: jest.fn((byteCount) => 'mockRandomBase64String'.repeat(byteCount)),
  };

  // Keep existing mock for NativeAnimatedModule if needed by your animations
  RN.NativeModules.NativeAnimatedModule = {
    startOperationBatch: jest.fn(),
    finishOperationBatch: jest.fn(),
    createAnimatedNode: jest.fn(),
    getValue: jest.fn(),
  };

  // Mock for DevSettings native part (to fix NativeEventEmitter warnings)
  RN.NativeModules.DevSettings = {
     addMenuItem: jest.fn(),
     reload: jest.fn(),
     // Add required emitter methods
     addListener: jest.fn(),
     removeListeners: jest.fn(),
  };

  // Add mocks for any OTHER specific NativeModules your app directly uses here
  // e.g., RN.NativeModules.SomeOtherModule = { ... };

  // --- Return the final mock object ---
  // NOTE: The console warnings about extracted modules (Clipboard, ProgressBarAndroid, etc.)
  // and the NativeEventEmitter warnings are often side effects of using requireActual above.
  // They happen when RN initializes itself. The mocks here aim to prevent crashes.
  return {
    ...RN, // Spread the rest of the actual react-native implementation

    // Override specific parts as needed
    Platform: {
      ...RN.Platform,
      OS: 'ios', // Or 'android' based on your needs
      select: jest.fn(selector => selector.ios ?? selector.default), // More robust select mock
    },
    Image: {
      ...RN.Image,
      resolveAssetSource: jest.fn(source => ({ uri: 'mock-uri-for-' + source })), // Simple mock
    },
    StyleSheet: {
        ...RN.StyleSheet,
        create: jest.fn((styles) => styles), // Pass-through mock
        flatten: jest.fn((style) => style) // Pass-through mock
    },
    // Add mocks for other core RN APIs if needed (Alert, Dimensions, etc.)
    // Alert: { alert: jest.fn() },
    // Dimensions: { get: jest.fn(() => ({ width: 400, height: 800 }))},


    // --- Provide the mocked NativeModules ---
    // Explicitly list the modules you've mocked above.
    // Avoid spreading ...RN.NativeModules if it causes initialization errors.
    NativeModules: {
      SettingsManager: RN.NativeModules.SettingsManager,
      RNGetRandomValues: RN.NativeModules.RNGetRandomValues,
      NativeAnimatedModule: RN.NativeModules.NativeAnimatedModule,
      DevSettings: RN.NativeModules.DevSettings,
      // Add other explicitly mocked NativeModules here
      // e.g., SomeOtherModule: RN.NativeModules.SomeOtherModule,

      // You MIGHT need to spread the rest if tests rely on other, unmocked native modules,
      // but be aware this can sometimes re-introduce initialization issues. Test carefully.
      // ...RN.NativeModules,
    },
  };
});

// Mock expo-linear-gradient
jest.mock('expo-linear-gradient', () => {
  // Import View from react-native **inside** the mock factory
  // to ensure it uses the mocked version if necessary
  const View = require('react-native').View;
  // Return a simple functional component that mimics the basic structure
  return {
    LinearGradient: (props) => <View {...props} />,
  };
});

// Add global mocks like fetch
global.fetch = jest.fn(() =>
  Promise.resolve({
    ok: true, // Add ok property
    status: 200, // Add status
    json: () => Promise.resolve({}), // Default mock JSON response
    text: () => Promise.resolve(''), // Default mock text response
  })
);