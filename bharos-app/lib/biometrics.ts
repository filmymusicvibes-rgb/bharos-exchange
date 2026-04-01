import * as LocalAuthentication from 'expo-local-authentication'
import AsyncStorage from '@react-native-async-storage/async-storage'

const BIOMETRIC_ENABLED_KEY = 'bharos_biometric_enabled'

export interface BiometricStatus {
  isAvailable: boolean
  isEnabled: boolean
  biometricType: string
}

// Check if device supports biometric auth
export async function checkBiometricSupport(): Promise<BiometricStatus> {
  const hasHardware = await LocalAuthentication.hasHardwareAsync()
  const isEnrolled = await LocalAuthentication.isEnrolledAsync()
  const types = await LocalAuthentication.supportedAuthenticationTypesAsync()
  const isEnabled = (await AsyncStorage.getItem(BIOMETRIC_ENABLED_KEY)) === 'true'

  let biometricType = 'None'
  if (types.includes(LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION)) {
    biometricType = 'Face ID'
  } else if (types.includes(LocalAuthentication.AuthenticationType.FINGERPRINT)) {
    biometricType = 'Fingerprint'
  } else if (types.includes(LocalAuthentication.AuthenticationType.IRIS)) {
    biometricType = 'Iris'
  }

  return {
    isAvailable: hasHardware && isEnrolled,
    isEnabled,
    biometricType,
  }
}

// Authenticate user with biometrics
export async function authenticateWithBiometrics(
  promptMessage?: string
): Promise<boolean> {
  try {
    const result = await LocalAuthentication.authenticateAsync({
      promptMessage: promptMessage || 'Authenticate to access Bharos Exchange',
      cancelLabel: 'Cancel',
      disableDeviceFallback: false,
      fallbackLabel: 'Use Password',
    })
    return result.success
  } catch (err) {
    console.log('Biometric auth error:', err)
    return false
  }
}

// Enable/disable biometric login
export async function setBiometricEnabled(enabled: boolean): Promise<void> {
  await AsyncStorage.setItem(BIOMETRIC_ENABLED_KEY, enabled ? 'true' : 'false')
}

// Check if biometric is enabled
export async function isBiometricEnabled(): Promise<boolean> {
  return (await AsyncStorage.getItem(BIOMETRIC_ENABLED_KEY)) === 'true'
}

// Authenticate for sensitive actions (transactions, withdrawals)
export async function authenticateForTransaction(
  amount: number,
  type: 'send' | 'withdraw' | 'stake'
): Promise<boolean> {
  const status = await checkBiometricSupport()
  if (!status.isAvailable || !status.isEnabled) {
    return true // Skip if not available or not enabled
  }

  const messages: Record<string, string> = {
    send: `Authenticate to send ${amount.toLocaleString()} BRS`,
    withdraw: `Authenticate to withdraw ${amount.toLocaleString()} BRS`,
    stake: `Authenticate to stake ${amount.toLocaleString()} BRS`,
  }

  return authenticateWithBiometrics(messages[type])
}
