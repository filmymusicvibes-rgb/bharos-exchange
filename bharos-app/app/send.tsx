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

const recentAddresses = [
  { name: 'Ravi Kumar', address: '0x7a3F...8b2E', short: 'RK' },
  { name: 'Priya Sharma', address: '0x4e9D...1c4A', short: 'PS' },
  { name: 'Sunil Reddy', address: '0x2b8C...7d3F', short: 'SR' },
]

export default function SendScreen() {
  const [address, setAddress] = useState('')
  const [amount, setAmount] = useState('')
  const [note, setNote] = useState('')
  const [sending, setSending] = useState(false)
  const [step, setStep] = useState<'form' | 'confirm' | 'success'>('form')

  const amountNum = parseFloat(amount) || 0
  const usdValue = amountNum * BRS_PRICE
  const networkFee = 0.5 // BRS
  const totalDeduction = amountNum + networkFee

  const handleSend = async () => {
    if (!address.trim()) return Alert.alert('Error', 'Please enter wallet address')
    if (amountNum <= 0) return Alert.alert('Error', 'Please enter valid amount')
    setStep('confirm')
  }

  const handleConfirm = async () => {
    // Biometric authentication for security
    const authenticated = await authenticateForTransaction(amountNum, 'send')
    if (!authenticated) {
      Alert.alert('Authentication Failed', 'Transaction cancelled for security.')
      return
    }
    setSending(true)
    try {
      const email = await AsyncStorage.getItem('bharos_user')
      if (!email) return
      const snap = await getDoc(doc(db, 'users', email))
      if (snap.exists()) {
        const data: any = snap.data()
        const currentBrs = Number(data.brsBalance || 0)
        if (currentBrs < totalDeduction) {
          Alert.alert('Insufficient Balance', `You need ${totalDeduction} BRS but only have ${currentBrs} BRS`)
          setSending(false)
          return
        }
        await updateDoc(doc(db, 'users', email), {
          brsBalance: currentBrs - totalDeduction,
        })
        await addDoc(collection(db, 'transactions'), {
          userId: email,
          type: 'send',
          amount: -amountNum,
          currency: 'BRS',
          description: `Sent to ${address.substring(0, 10)}...`,
          fee: networkFee,
          toAddress: address,
          note: note,
          status: 'completed',
          createdAt: serverTimestamp(),
        })
      }
      // Send success notification
      await NotificationTemplates.transactionSent(amountNum, address)
      setStep('success')
    } catch (err) {
      Alert.alert('Error', 'Transaction failed. Please try again.')
    } finally {
      setSending(false)
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
            <Text style={styles.successTitle}>Transaction Sent!</Text>
            <Text style={styles.successSub}>Your BRS has been sent successfully</Text>

            <View style={styles.successCard}>
              <View style={styles.successRow}>
                <Text style={styles.successLabel}>Amount</Text>
                <Text style={styles.successValue}>{amountNum.toLocaleString()} BRS</Text>
              </View>
              <View style={styles.successDivider} />
              <View style={styles.successRow}>
                <Text style={styles.successLabel}>To</Text>
                <Text style={styles.successValue} numberOfLines={1}>{address}</Text>
              </View>
              <View style={styles.successDivider} />
              <View style={styles.successRow}>
                <Text style={styles.successLabel}>Fee</Text>
                <Text style={styles.successValue}>{networkFee} BRS</Text>
              </View>
              <View style={styles.successDivider} />
              <View style={styles.successRow}>
                <Text style={styles.successLabel}>USD Value</Text>
                <Text style={[styles.successValue, { color: colors.primary }]}>${usdValue.toFixed(4)}</Text>
              </View>
            </View>

            <TouchableOpacity style={styles.doneBtn} onPress={() => router.back()}>
              <LinearGradient colors={colors.gradientPrimary} style={styles.doneBtnGrad}>
                <Text style={styles.doneBtnText}>Done</Text>
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
            <Text style={styles.title}>Confirm Send</Text>
            <View style={{ width: 38 }} />
          </Animated.View>

          <Animated.View entering={FadeInUp.delay(100).duration(600)}>
            <View style={styles.confirmCard}>
              <View style={styles.confirmAmountSection}>
                <Text style={styles.confirmAmountLabel}>You're sending</Text>
                <Text style={styles.confirmAmount}>{amountNum.toLocaleString()}</Text>
                <Text style={styles.confirmCurrency}>BRS</Text>
                <Text style={styles.confirmUsd}>≈ ${usdValue.toFixed(4)} USD</Text>
              </View>

              <View style={styles.confirmArrow}>
                <View style={styles.confirmArrowIcon}>
                  <Ionicons name="arrow-down" size={18} color={colors.primary} />
                </View>
              </View>

              <View style={styles.confirmDetails}>
                <View style={styles.confirmRow}>
                  <Text style={styles.confirmLabel}>To Address</Text>
                  <Text style={styles.confirmValue} numberOfLines={1}>{address}</Text>
                </View>
                {note ? (
                  <View style={styles.confirmRow}>
                    <Text style={styles.confirmLabel}>Note</Text>
                    <Text style={styles.confirmValue}>{note}</Text>
                  </View>
                ) : null}
                <View style={styles.confirmDivider} />
                <View style={styles.confirmRow}>
                  <Text style={styles.confirmLabel}>Network Fee</Text>
                  <Text style={styles.confirmValue}>{networkFee} BRS</Text>
                </View>
                <View style={styles.confirmRow}>
                  <Text style={styles.confirmLabel}>Total Deduction</Text>
                  <Text style={[styles.confirmValue, { color: colors.red, fontWeight: '700' }]}>{totalDeduction.toLocaleString()} BRS</Text>
                </View>
              </View>
            </View>
          </Animated.View>

          <Animated.View entering={FadeInUp.delay(200).duration(600)}>
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={handleConfirm}
              disabled={sending}
            >
              <LinearGradient colors={colors.gradientPrimary} style={styles.sendBtn}>
                <Ionicons name={sending ? 'hourglass' : 'paper-plane'} size={18} color="#000" />
                <Text style={styles.sendBtnText}>{sending ? 'Sending...' : 'Confirm & Send'}</Text>
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
            <Text style={styles.title}>Send BRS</Text>
            <TouchableOpacity style={styles.backBtn}>
              <Ionicons name="scan-outline" size={20} color={colors.textSecondary} />
            </TouchableOpacity>
          </Animated.View>

          {/* Amount Input */}
          <Animated.View entering={FadeInUp.delay(100).duration(600)}>
            <View style={styles.amountCard}>
              <Text style={styles.amountLabel}>Amount to Send</Text>
              <View style={styles.amountInput}>
                <TextInput
                  style={styles.amountValue}
                  value={amount}
                  onChangeText={setAmount}
                  keyboardType="decimal-pad"
                  placeholder="0"
                  placeholderTextColor={colors.textMuted}
                />
                <View style={styles.amountBadge}>
                  <LinearGradient colors={colors.gradientGold} style={styles.amountCoinIcon}>
                    <Text style={styles.amountCoinText}>B</Text>
                  </LinearGradient>
                  <Text style={styles.amountCurrency}>BRS</Text>
                </View>
              </View>
              <Text style={styles.amountUsd}>≈ ${usdValue.toFixed(4)} USD</Text>
              <View style={styles.quickAmounts}>
                {['100', '500', '1000', '5000'].map(val => (
                  <TouchableOpacity key={val} style={styles.quickAmountBtn} onPress={() => setAmount(val)}>
                    <Text style={styles.quickAmountText}>{Number(val).toLocaleString()}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </Animated.View>

          {/* Wallet Address */}
          <Animated.View entering={FadeInUp.delay(200).duration(600)}>
            <View style={styles.fieldCard}>
              <Text style={styles.fieldLabel}>Wallet Address</Text>
              <View style={styles.fieldInputWrap}>
                <Ionicons name="wallet-outline" size={18} color={colors.textMuted} />
                <TextInput
                  style={styles.fieldInput}
                  value={address}
                  onChangeText={setAddress}
                  placeholder="Enter BRS wallet address"
                  placeholderTextColor={colors.textMuted}
                  autoCapitalize="none"
                />
                <TouchableOpacity style={styles.pasteBtn}>
                  <Ionicons name="clipboard-outline" size={16} color={colors.primary} />
                </TouchableOpacity>
              </View>
            </View>
          </Animated.View>

          {/* Note */}
          <Animated.View entering={FadeInUp.delay(250).duration(600)}>
            <View style={styles.fieldCard}>
              <Text style={styles.fieldLabel}>Note (Optional)</Text>
              <View style={styles.fieldInputWrap}>
                <Ionicons name="chatbubble-outline" size={18} color={colors.textMuted} />
                <TextInput
                  style={styles.fieldInput}
                  value={note}
                  onChangeText={setNote}
                  placeholder="Add a note"
                  placeholderTextColor={colors.textMuted}
                />
              </View>
            </View>
          </Animated.View>

          {/* Recent Addresses */}
          <Animated.View entering={FadeInUp.delay(300).duration(600)}>
            <Text style={styles.recentTitle}>Recent</Text>
            {recentAddresses.map((item, i) => (
              <TouchableOpacity
                key={i}
                activeOpacity={0.7}
                onPress={() => setAddress(item.address)}
              >
                <View style={styles.recentCard}>
                  <View style={styles.recentAvatar}>
                    <Text style={styles.recentAvatarText}>{item.short}</Text>
                  </View>
                  <View style={styles.recentInfo}>
                    <Text style={styles.recentName}>{item.name}</Text>
                    <Text style={styles.recentAddr}>{item.address}</Text>
                  </View>
                  <Ionicons name="chevron-forward" size={16} color={colors.textMuted} />
                </View>
              </TouchableOpacity>
            ))}
          </Animated.View>

          {/* Fee Info */}
          <Animated.View entering={FadeInUp.delay(350).duration(600)}>
            <View style={styles.feeCard}>
              <View style={styles.feeRow}>
                <Ionicons name="information-circle-outline" size={16} color={colors.textMuted} />
                <Text style={styles.feeText}>Network Fee: {networkFee} BRS</Text>
              </View>
              <View style={styles.feeRow}>
                <Ionicons name="timer-outline" size={16} color={colors.textMuted} />
                <Text style={styles.feeText}>Estimated Time: ~30 seconds</Text>
              </View>
            </View>
          </Animated.View>

          {/* Send Button */}
          <Animated.View entering={FadeInUp.delay(400).duration(600)}>
            <TouchableOpacity activeOpacity={0.8} onPress={handleSend}>
              <LinearGradient colors={colors.gradientPrimary} style={styles.sendBtn}>
                <Ionicons name="paper-plane" size={18} color="#000" />
                <Text style={styles.sendBtnText}>Review Transaction</Text>
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

  // Header
  header: { flexDirection: 'row', alignItems: 'center', marginBottom: spacing.xxl },
  backBtn: {
    ...neu.iconCircle,
    width: 38, height: 38, borderRadius: 19,
    justifyContent: 'center', alignItems: 'center',
  },
  title: { flex: 1, color: colors.white, fontSize: 20, fontWeight: '700', textAlign: 'center' },

  // Amount card
  amountCard: {
    ...neu.card,
    padding: spacing.xxl,
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  amountLabel: { color: colors.textTertiary, fontSize: 13, fontWeight: '500', marginBottom: spacing.lg },
  amountInput: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  amountValue: {
    color: colors.white, fontSize: 42, fontWeight: '800',
    letterSpacing: -2, minWidth: 80, textAlign: 'right',
  },
  amountBadge: {
    ...neu.badge,
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: spacing.md, paddingVertical: spacing.sm,
    gap: spacing.xs,
  },
  amountCoinIcon: { width: 22, height: 22, borderRadius: 11, justifyContent: 'center', alignItems: 'center' },
  amountCoinText: { color: '#000', fontSize: 11, fontWeight: '900' },
  amountCurrency: { color: colors.gold, fontSize: 14, fontWeight: '700' },
  amountUsd: { color: colors.textMuted, fontSize: 13, marginTop: spacing.sm },
  quickAmounts: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.lg },
  quickAmountBtn: {
    ...neu.inset,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
  },
  quickAmountText: { color: colors.textSecondary, fontSize: 12, fontWeight: '600' },

  // Fields
  fieldCard: {
    ...neu.cardSoft,
    padding: spacing.lg,
    marginBottom: spacing.md,
  },
  fieldLabel: { color: colors.textTertiary, fontSize: 12, fontWeight: '600', marginBottom: spacing.sm, letterSpacing: 0.3 },
  fieldInputWrap: {
    ...neu.inset,
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: spacing.md, gap: spacing.sm,
  },
  fieldInput: {
    flex: 1, color: colors.white, fontSize: 14, fontWeight: '500',
    paddingVertical: spacing.md,
  },
  pasteBtn: {
    padding: spacing.xs,
  },

  // Recent
  recentTitle: { color: colors.textMuted, fontSize: 11, fontWeight: '700', letterSpacing: 1, textTransform: 'uppercase', marginBottom: spacing.sm, marginTop: spacing.md },
  recentCard: {
    ...neu.cardSoft,
    flexDirection: 'row', alignItems: 'center',
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
  recentAvatar: {
    ...neu.iconCircle,
    width: 38, height: 38, borderRadius: 19,
    justifyContent: 'center', alignItems: 'center', marginRight: spacing.md,
  },
  recentAvatarText: { color: colors.primary, fontSize: 13, fontWeight: '700' },
  recentInfo: { flex: 1 },
  recentName: { color: colors.white, fontSize: 14, fontWeight: '600' },
  recentAddr: { color: colors.textMuted, fontSize: 11, marginTop: 1 },

  // Fee
  feeCard: {
    ...neu.inset,
    padding: spacing.lg,
    marginTop: spacing.lg,
    marginBottom: spacing.xl,
    gap: spacing.sm,
  },
  feeRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  feeText: { color: colors.textMuted, fontSize: 12 },

  // Send button
  sendBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: spacing.sm, paddingVertical: spacing.lg,
    borderRadius: radius.xl,
    ...shadows.neuSoft,
  },
  sendBtnText: { color: '#000', fontSize: 16, fontWeight: '800' },

  // Confirm
  confirmCard: {
    ...neu.card,
    padding: spacing.xxl,
    marginBottom: spacing.xxl,
  },
  confirmAmountSection: { alignItems: 'center', marginBottom: spacing.xl },
  confirmAmountLabel: { color: colors.textTertiary, fontSize: 13 },
  confirmAmount: { color: colors.white, fontSize: 48, fontWeight: '800', letterSpacing: -2 },
  confirmCurrency: { color: colors.gold, fontSize: 18, fontWeight: '700' },
  confirmUsd: { color: colors.textMuted, fontSize: 13, marginTop: spacing.xs },
  confirmArrow: { alignItems: 'center', marginBottom: spacing.xl },
  confirmArrowIcon: {
    ...neu.iconCircle,
    width: 36, height: 36, borderRadius: 18,
    justifyContent: 'center', alignItems: 'center',
  },
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
    width: '100%', padding: spacing.xl,
    marginBottom: spacing.xxl, gap: spacing.md,
  },
  successRow: { flexDirection: 'row', justifyContent: 'space-between' },
  successLabel: { color: colors.textMuted, fontSize: 13 },
  successValue: { color: colors.white, fontSize: 13, fontWeight: '600' },
  successDivider: { height: 1, backgroundColor: 'rgba(255,255,255,0.06)' },
  doneBtn: { width: '100%' },
  doneBtnGrad: {
    paddingVertical: spacing.lg, borderRadius: radius.xl,
    alignItems: 'center', ...shadows.neuSoft,
  },
  doneBtnText: { color: '#000', fontSize: 16, fontWeight: '800' },
})
