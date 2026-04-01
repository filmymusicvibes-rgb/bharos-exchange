import { useState } from 'react'
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  TextInput, Alert, KeyboardAvoidingView, Platform,
} from 'react-native'
import { LinearGradient } from 'expo-linear-gradient'
import { Ionicons } from '@expo/vector-icons'
import Animated, { FadeInDown, FadeInUp, FadeIn } from 'react-native-reanimated'
import { colors, spacing, radius, neu, shadows } from '../lib/theme'
import { router } from 'expo-router'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { db } from '../lib/firebase'
import { doc, getDoc, updateDoc, addDoc, collection, serverTimestamp } from 'firebase/firestore'
import { authenticateForTransaction } from '../lib/biometrics'
import { NotificationTemplates } from '../lib/notifications'
import { BRS_PRICE } from '../lib/price'
const MIN_WITHDRAW = 100
const WITHDRAW_FEE_PERCENT = 2 // 2%

const withdrawMethods = [
  { id: 'bsc', name: 'BSC Network', icon: 'globe-outline', sub: 'BEP-20 Token', color: '#F3BA2F', time: '~5 min' },
  { id: 'trc', name: 'TRC-20', icon: 'swap-horizontal', sub: 'Tron Network', color: '#FF0013', time: '~3 min' },
  { id: 'usdt', name: 'Swap to USDT', icon: 'cash-outline', sub: 'Internal Swap', color: colors.green, time: 'Instant' },
]

export default function WithdrawScreen() {
  const [amount, setAmount] = useState('')
  const [address, setAddress] = useState('')
  const [selectedMethod, setSelectedMethod] = useState('bsc')
  const [step, setStep] = useState<'form' | 'confirm' | 'success'>('form')
  const [processing, setProcessing] = useState(false)

  const amountNum = parseFloat(amount) || 0
  const fee = amountNum * (WITHDRAW_FEE_PERCENT / 100)
  const youReceive = amountNum - fee
  const usdValue = youReceive * BRS_PRICE

  const handleWithdraw = () => {
    if (amountNum < MIN_WITHDRAW) return Alert.alert('Minimum', `Minimum withdrawal is ${MIN_WITHDRAW} BRS`)
    if (!address.trim() && selectedMethod !== 'usdt') return Alert.alert('Error', 'Please enter wallet address')
    setStep('confirm')
  }

  const handleConfirm = async () => {
    const authenticated = await authenticateForTransaction(amountNum, 'withdraw')
    if (!authenticated) {
      Alert.alert('Authentication Failed', 'Withdrawal cancelled for security.')
      return
    }
    setProcessing(true)
    try {
      const email = await AsyncStorage.getItem('bharos_user')
      if (!email) return
      const snap = await getDoc(doc(db, 'users', email))
      if (snap.exists()) {
        const data: any = snap.data()
        const currentBrs = Number(data.brsBalance || 0)
        if (currentBrs < amountNum) {
          Alert.alert('Insufficient Balance', `You need ${amountNum} BRS but only have ${currentBrs} BRS`)
          setProcessing(false)
          return
        }
        if (selectedMethod === 'usdt') {
          await updateDoc(doc(db, 'users', email), {
            brsBalance: currentBrs - amountNum,
            usdtBalance: (Number(data.usdtBalance || 0)) + usdValue,
          })
        } else {
          await updateDoc(doc(db, 'users', email), {
            brsBalance: currentBrs - amountNum,
          })
        }
        await addDoc(collection(db, 'transactions'), {
          userId: email,
          type: 'withdraw',
          amount: -amountNum,
          currency: 'BRS',
          description: selectedMethod === 'usdt' ? 'Swapped to USDT' : `Withdrawal via ${selectedMethod.toUpperCase()}`,
          fee: fee,
          method: selectedMethod,
          toAddress: address || 'internal',
          status: 'processing',
          createdAt: serverTimestamp(),
        })
      }
      await NotificationTemplates.withdrawalProcessed(amountNum)
      setStep('success')
    } catch (err) {
      Alert.alert('Error', 'Withdrawal failed. Please try again.')
    } finally {
      setProcessing(false)
    }
  }

  if (step === 'success') {
    return (
      <LinearGradient colors={colors.gradientScreen} style={styles.container}>
        <View style={styles.successContainer}>
          <Animated.View entering={FadeIn.duration(600)} style={styles.successContent}>
            <View style={styles.successIconNeu}>
              <LinearGradient colors={colors.gradientPrimary} style={styles.successIcon}>
                <Ionicons name="checkmark" size={40} color="#000" />
              </LinearGradient>
            </View>
            <Text style={styles.successTitle}>Withdrawal Initiated!</Text>
            <Text style={styles.successSub}>Your withdrawal is being processed</Text>

            <View style={styles.successCard}>
              <View style={styles.successRow}>
                <Text style={styles.successLabel}>Amount</Text>
                <Text style={styles.successValue}>{amountNum.toLocaleString()} BRS</Text>
              </View>
              <View style={styles.successDivider} />
              <View style={styles.successRow}>
                <Text style={styles.successLabel}>Fee ({WITHDRAW_FEE_PERCENT}%)</Text>
                <Text style={styles.successValue}>{fee.toFixed(2)} BRS</Text>
              </View>
              <View style={styles.successDivider} />
              <View style={styles.successRow}>
                <Text style={styles.successLabel}>You Receive</Text>
                <Text style={[styles.successValue, { color: colors.primary }]}>{youReceive.toFixed(2)} BRS</Text>
              </View>
              <View style={styles.successDivider} />
              <View style={styles.successRow}>
                <Text style={styles.successLabel}>USD Value</Text>
                <Text style={[styles.successValue, { color: colors.gold }]}>${usdValue.toFixed(4)}</Text>
              </View>
              <View style={styles.successDivider} />
              <View style={styles.successRow}>
                <Text style={styles.successLabel}>Status</Text>
                <View style={styles.statusTag}>
                  <View style={styles.statusDot} />
                  <Text style={styles.statusText}>Processing</Text>
                </View>
              </View>
            </View>

            <TouchableOpacity style={styles.doneBtn} onPress={() => router.back()}>
              <LinearGradient colors={colors.gradientPrimary} style={styles.doneBtnGrad}>
                <Text style={styles.doneBtnText}>Back to Wallet</Text>
              </LinearGradient>
            </TouchableOpacity>
          </Animated.View>
        </View>
      </LinearGradient>
    )
  }

  if (step === 'confirm') {
    return (
      <LinearGradient colors={colors.gradientScreen} style={styles.container}>
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
          <Animated.View entering={FadeInDown.duration(500)} style={styles.header}>
            <TouchableOpacity style={styles.backBtn} onPress={() => setStep('form')}>
              <Ionicons name="arrow-back" size={20} color={colors.textSecondary} />
            </TouchableOpacity>
            <Text style={styles.title}>Confirm Withdrawal</Text>
            <View style={{ width: 38 }} />
          </Animated.View>

          <Animated.View entering={FadeInUp.delay(100).duration(600)}>
            <View style={styles.confirmCard}>
              <View style={styles.confirmAmount}>
                <Text style={styles.confirmAmountLabel}>Withdrawal Amount</Text>
                <Text style={styles.confirmAmountVal}>{amountNum.toLocaleString()}</Text>
                <Text style={styles.confirmAmountCur}>BRS</Text>
              </View>

              <View style={styles.confirmDetails}>
                <View style={styles.confirmRow}>
                  <Text style={styles.confirmLabel}>Method</Text>
                  <Text style={styles.confirmValue}>{withdrawMethods.find(m => m.id === selectedMethod)?.name}</Text>
                </View>
                {address ? (
                  <View style={styles.confirmRow}>
                    <Text style={styles.confirmLabel}>To Address</Text>
                    <Text style={styles.confirmValue} numberOfLines={1}>{address}</Text>
                  </View>
                ) : null}
                <View style={styles.confirmDivider} />
                <View style={styles.confirmRow}>
                  <Text style={styles.confirmLabel}>Fee ({WITHDRAW_FEE_PERCENT}%)</Text>
                  <Text style={[styles.confirmValue, { color: colors.red }]}>-{fee.toFixed(2)} BRS</Text>
                </View>
                <View style={styles.confirmRow}>
                  <Text style={styles.confirmLabel}>You Receive</Text>
                  <Text style={[styles.confirmValue, { color: colors.primary, fontWeight: '700' }]}>{youReceive.toFixed(2)} BRS</Text>
                </View>
                <View style={styles.confirmRow}>
                  <Text style={styles.confirmLabel}>≈ USD</Text>
                  <Text style={[styles.confirmValue, { color: colors.gold }]}>${usdValue.toFixed(4)}</Text>
                </View>
              </View>
            </View>
          </Animated.View>

          <Animated.View entering={FadeInUp.delay(200).duration(600)}>
            <TouchableOpacity activeOpacity={0.8} onPress={handleConfirm} disabled={processing}>
              <LinearGradient colors={colors.gradientPrimary} style={styles.withdrawBtn}>
                <Ionicons name={processing ? 'hourglass' : 'arrow-down-circle'} size={18} color="#000" />
                <Text style={styles.withdrawBtnText}>{processing ? 'Processing...' : 'Confirm Withdrawal'}</Text>
              </LinearGradient>
            </TouchableOpacity>
          </Animated.View>
        </ScrollView>
      </LinearGradient>
    )
  }

  return (
    <LinearGradient colors={colors.gradientScreen} style={styles.container}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
          {/* Header */}
          <Animated.View entering={FadeInDown.duration(500)} style={styles.header}>
            <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
              <Ionicons name="arrow-back" size={20} color={colors.textSecondary} />
            </TouchableOpacity>
            <Text style={styles.title}>Withdraw</Text>
            <View style={{ width: 38 }} />
          </Animated.View>

          {/* Withdraw Methods */}
          <Animated.View entering={FadeInUp.delay(100).duration(600)}>
            <Text style={styles.sectionLabel}>Select Method</Text>
            {withdrawMethods.map((method, i) => (
              <TouchableOpacity
                key={method.id}
                activeOpacity={0.7}
                onPress={() => setSelectedMethod(method.id)}
              >
                <View style={[
                  styles.methodCard,
                  selectedMethod === method.id && styles.methodCardActive,
                ]}>
                  <View style={[styles.methodIcon, { backgroundColor: `${method.color}15` }]}>
                    <Ionicons name={method.icon as any} size={22} color={method.color} />
                  </View>
                  <View style={styles.methodInfo}>
                    <Text style={styles.methodName}>{method.name}</Text>
                    <Text style={styles.methodSub}>{method.sub}</Text>
                  </View>
                  <View style={styles.methodRight}>
                    <Text style={styles.methodTime}>{method.time}</Text>
                    <View style={[
                      styles.methodRadio,
                      selectedMethod === method.id && styles.methodRadioActive,
                    ]}>
                      {selectedMethod === method.id && <View style={styles.methodRadioDot} />}
                    </View>
                  </View>
                </View>
              </TouchableOpacity>
            ))}
          </Animated.View>

          {/* Amount */}
          <Animated.View entering={FadeInUp.delay(200).duration(600)}>
            <View style={styles.amountCard}>
              <View style={styles.amountHeader}>
                <Text style={styles.amountLabel}>Amount (BRS)</Text>
                <Text style={styles.minLabel}>Min: {MIN_WITHDRAW} BRS</Text>
              </View>
              <View style={styles.amountInputWrap}>
                <TextInput
                  style={styles.amountInput}
                  value={amount}
                  onChangeText={setAmount}
                  keyboardType="decimal-pad"
                  placeholder="0"
                  placeholderTextColor={colors.textMuted}
                />
                <View style={styles.amountBadge}>
                  <LinearGradient colors={colors.gradientGold} style={styles.coinMini}>
                    <Text style={styles.coinMiniText}>B</Text>
                  </LinearGradient>
                  <Text style={styles.amountCurrency}>BRS</Text>
                </View>
              </View>
              {amountNum > 0 && (
                <View style={styles.amountSummary}>
                  <View style={styles.summaryRow}>
                    <Text style={styles.summaryLabel}>Fee ({WITHDRAW_FEE_PERCENT}%)</Text>
                    <Text style={styles.summaryValue}>-{fee.toFixed(2)} BRS</Text>
                  </View>
                  <View style={styles.summaryRow}>
                    <Text style={styles.summaryLabel}>You Receive</Text>
                    <Text style={[styles.summaryValue, { color: colors.primary }]}>{youReceive.toFixed(2)} BRS</Text>
                  </View>
                  <View style={styles.summaryRow}>
                    <Text style={styles.summaryLabel}>≈ USD Value</Text>
                    <Text style={[styles.summaryValue, { color: colors.gold }]}>${usdValue.toFixed(4)}</Text>
                  </View>
                </View>
              )}
            </View>
          </Animated.View>

          {/* Wallet Address (hidden for USDT swap) */}
          {selectedMethod !== 'usdt' && (
            <Animated.View entering={FadeInUp.delay(250).duration(600)}>
              <View style={styles.fieldCard}>
                <Text style={styles.fieldLabel}>External Wallet Address</Text>
                <View style={styles.fieldInputWrap}>
                  <Ionicons name="wallet-outline" size={18} color={colors.textMuted} />
                  <TextInput
                    style={styles.fieldInput}
                    value={address}
                    onChangeText={setAddress}
                    placeholder="Enter external wallet address"
                    placeholderTextColor={colors.textMuted}
                    autoCapitalize="none"
                  />
                </View>
              </View>
            </Animated.View>
          )}

          {/* Warning */}
          <Animated.View entering={FadeInUp.delay(300).duration(600)}>
            <View style={styles.warningCard}>
              <Ionicons name="warning" size={18} color={colors.orange} />
              <Text style={styles.warningText}>
                Please double-check the address before confirming. Transactions cannot be reversed.
              </Text>
            </View>
          </Animated.View>

          {/* Withdraw Button */}
          <Animated.View entering={FadeInUp.delay(350).duration(600)}>
            <TouchableOpacity activeOpacity={0.8} onPress={handleWithdraw}>
              <LinearGradient colors={colors.gradientPrimary} style={styles.withdrawBtn}>
                <Ionicons name="arrow-down-circle" size={18} color="#000" />
                <Text style={styles.withdrawBtnText}>Review Withdrawal</Text>
              </LinearGradient>
            </TouchableOpacity>
          </Animated.View>

          <View style={{ height: 40 }} />
        </ScrollView>
      </KeyboardAvoidingView>
    </LinearGradient>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: { paddingHorizontal: spacing.xl, paddingTop: 56 },

  header: { flexDirection: 'row', alignItems: 'center', marginBottom: spacing.xxl },
  backBtn: {
    ...neu.iconCircle,
    width: 38, height: 38, borderRadius: 19,
    justifyContent: 'center', alignItems: 'center',
  },
  title: { flex: 1, color: colors.white, fontSize: 20, fontWeight: '700', textAlign: 'center' },

  // Section
  sectionLabel: {
    color: colors.textMuted, fontSize: 11, fontWeight: '700',
    letterSpacing: 1, textTransform: 'uppercase', marginBottom: spacing.sm,
  },

  // Method Cards
  methodCard: {
    ...neu.cardSoft,
    flexDirection: 'row', alignItems: 'center',
    padding: spacing.lg, marginBottom: spacing.sm,
  },
  methodCardActive: {
    borderColor: colors.primary,
  },
  methodIcon: {
    width: 44, height: 44, borderRadius: 22,
    justifyContent: 'center', alignItems: 'center',
    marginRight: spacing.md,
  },
  methodInfo: { flex: 1 },
  methodName: { color: colors.white, fontSize: 15, fontWeight: '600' },
  methodSub: { color: colors.textMuted, fontSize: 11, marginTop: 1 },
  methodRight: { alignItems: 'flex-end', gap: spacing.xs },
  methodTime: { color: colors.textSecondary, fontSize: 11 },
  methodRadio: {
    width: 20, height: 20, borderRadius: 10,
    borderWidth: 2, borderColor: colors.textMuted,
    justifyContent: 'center', alignItems: 'center',
  },
  methodRadioActive: { borderColor: colors.primary },
  methodRadioDot: {
    width: 10, height: 10, borderRadius: 5,
    backgroundColor: colors.primary,
  },

  // Amount
  amountCard: {
    ...neu.card,
    padding: spacing.xl, marginTop: spacing.lg, marginBottom: spacing.md,
  },
  amountHeader: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', marginBottom: spacing.lg,
  },
  amountLabel: { color: colors.textTertiary, fontSize: 13, fontWeight: '500' },
  minLabel: { color: colors.textMuted, fontSize: 11 },
  amountInputWrap: {
    ...neu.inset,
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: spacing.lg, paddingVertical: spacing.xs,
  },
  amountInput: {
    flex: 1, color: colors.white, fontSize: 28, fontWeight: '800',
    paddingVertical: spacing.sm,
  },
  amountBadge: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.xs,
  },
  coinMini: { width: 22, height: 22, borderRadius: 11, justifyContent: 'center', alignItems: 'center' },
  coinMiniText: { color: '#000', fontSize: 11, fontWeight: '900' },
  amountCurrency: { color: colors.gold, fontSize: 14, fontWeight: '700' },
  amountSummary: {
    marginTop: spacing.lg, gap: spacing.sm,
    borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.06)',
    paddingTop: spacing.md,
  },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between' },
  summaryLabel: { color: colors.textMuted, fontSize: 12 },
  summaryValue: { color: colors.white, fontSize: 12, fontWeight: '600' },

  // Fields
  fieldCard: {
    ...neu.cardSoft,
    padding: spacing.lg, marginBottom: spacing.md,
  },
  fieldLabel: { color: colors.textTertiary, fontSize: 12, fontWeight: '600', marginBottom: spacing.sm },
  fieldInputWrap: {
    ...neu.inset,
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: spacing.md, gap: spacing.sm,
  },
  fieldInput: {
    flex: 1, color: colors.white, fontSize: 14, fontWeight: '500',
    paddingVertical: spacing.md,
  },

  // Warning
  warningCard: {
    ...neu.inset,
    flexDirection: 'row', padding: spacing.lg, gap: spacing.md,
    marginBottom: spacing.xl, marginTop: spacing.sm,
  },
  warningText: { flex: 1, color: colors.orange, fontSize: 12, lineHeight: 18 },

  // Withdraw button
  withdrawBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: spacing.sm, paddingVertical: spacing.lg,
    borderRadius: radius.xl, ...shadows.neuSoft,
  },
  withdrawBtnText: { color: '#000', fontSize: 16, fontWeight: '800' },

  // Confirm
  confirmCard: {
    ...neu.card,
    padding: spacing.xxl, marginBottom: spacing.xxl,
  },
  confirmAmount: { alignItems: 'center', marginBottom: spacing.xl },
  confirmAmountLabel: { color: colors.textTertiary, fontSize: 13 },
  confirmAmountVal: { color: colors.white, fontSize: 42, fontWeight: '800', letterSpacing: -2 },
  confirmAmountCur: { color: colors.gold, fontSize: 18, fontWeight: '700' },
  confirmDetails: { gap: spacing.md },
  confirmRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  confirmLabel: { color: colors.textMuted, fontSize: 13 },
  confirmValue: { color: colors.white, fontSize: 13, fontWeight: '600', maxWidth: '60%' },
  confirmDivider: { height: 1, backgroundColor: 'rgba(255,255,255,0.06)' },

  // Success
  successContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: spacing.xl },
  successContent: { alignItems: 'center', width: '100%' },
  successIconNeu: {
    ...neu.iconCircle,
    width: 88, height: 88, borderRadius: 44,
    justifyContent: 'center', alignItems: 'center', marginBottom: spacing.xxl,
  },
  successIcon: { width: 76, height: 76, borderRadius: 38, justifyContent: 'center', alignItems: 'center' },
  successTitle: { color: colors.white, fontSize: 24, fontWeight: '800', marginBottom: spacing.sm },
  successSub: { color: colors.textSecondary, fontSize: 14, marginBottom: spacing.xxl },
  successCard: {
    ...neu.card,
    width: '100%', padding: spacing.xl, marginBottom: spacing.xxl, gap: spacing.md,
  },
  successRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  successLabel: { color: colors.textMuted, fontSize: 13 },
  successValue: { color: colors.white, fontSize: 13, fontWeight: '600' },
  successDivider: { height: 1, backgroundColor: 'rgba(255,255,255,0.06)' },
  statusTag: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs, backgroundColor: colors.orangeSoft, paddingHorizontal: spacing.md, paddingVertical: 3, borderRadius: radius.full },
  statusDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: colors.orange },
  statusText: { color: colors.orange, fontSize: 11, fontWeight: '600' },
  doneBtn: { width: '100%' },
  doneBtnGrad: {
    paddingVertical: spacing.lg, borderRadius: radius.xl,
    alignItems: 'center', ...shadows.neuSoft,
  },
  doneBtnText: { color: '#000', fontSize: 16, fontWeight: '800' },
})
