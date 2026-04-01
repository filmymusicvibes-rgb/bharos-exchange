import { useEffect, useState, useCallback } from 'react'
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  RefreshControl, ActivityIndicator,
} from 'react-native'
import { LinearGradient } from 'expo-linear-gradient'
import { Ionicons } from '@expo/vector-icons'
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated'
import { colors, spacing, radius, neu, shadows } from '../lib/theme'
import { router } from 'expo-router'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { db } from '../lib/firebase'
import { collection, getDocs, query, where, orderBy } from 'firebase/firestore'

const BRS_PRICE = 0.0055

const filterOptions = ['All', 'Send', 'Receive', 'Withdraw', 'Stake', 'Reward']

const dummyTransactions = [
  { id: '1', type: 'send', description: 'Sent to 0x7a3F...', amount: -50000, currency: 'BRS', status: 'completed', date: 'Apr 20, 2026' },
  { id: '2', type: 'receive', description: 'Received from 0x4e9D...', amount: 10000, currency: 'BRS', status: 'completed', date: 'Apr 18, 2026' },
  { id: '3', type: 'stake', description: 'Staked 90 Days', amount: -20000, currency: 'BRS', status: 'completed', date: 'Apr 15, 2026' },
  { id: '4', type: 'reward', description: 'Staking Reward', amount: 450, currency: 'BRS', status: 'completed', date: 'Apr 14, 2026' },
  { id: '5', type: 'withdraw', description: 'Withdrawal BSC', amount: -5000, currency: 'BRS', status: 'processing', date: 'Apr 12, 2026' },
  { id: '6', type: 'receive', description: 'Purchase BRS', amount: 100000, currency: 'BRS', status: 'completed', date: 'Apr 10, 2026' },
  { id: '7', type: 'send', description: 'Sent to 0x2b8C...', amount: -15000, currency: 'BRS', status: 'completed', date: 'Apr 8, 2026' },
  { id: '8', type: 'reward', description: 'Referral Commission', amount: 2500, currency: 'BRS', status: 'completed', date: 'Apr 5, 2026' },
  { id: '9', type: 'stake', description: 'Staked 30 Days', amount: -10000, currency: 'BRS', status: 'completed', date: 'Apr 3, 2026' },
  { id: '10', type: 'withdraw', description: 'Swap to USDT', amount: -8000, currency: 'BRS', status: 'completed', date: 'Apr 1, 2026' },
]

const getTypeIcon = (type: string) => {
  switch (type) {
    case 'send': return { icon: 'arrow-up', color: colors.red, bg: colors.redSoft }
    case 'receive': return { icon: 'arrow-down', color: colors.green, bg: colors.greenSoft }
    case 'withdraw': return { icon: 'download-outline', color: colors.orange, bg: colors.orangeSoft }
    case 'stake': return { icon: 'layers', color: colors.purple, bg: colors.purpleSoft }
    case 'reward': return { icon: 'gift', color: colors.gold, bg: colors.goldSoft }
    default: return { icon: 'swap-horizontal', color: colors.primary, bg: colors.primarySoft }
  }
}

export default function TransactionsScreen() {
  const [transactions, setTransactions] = useState<any[]>([])
  const [filter, setFilter] = useState('All')
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  const loadData = useCallback(async () => {
    try {
      const email = await AsyncStorage.getItem('bharos_user')
      if (!email) { setTransactions(dummyTransactions); setLoading(false); return }
      const txSnap = await getDocs(query(collection(db, 'transactions'), where('userId', '==', email), orderBy('createdAt', 'desc')))
      const txList: any[] = []
      txSnap.forEach(d => {
        const data = d.data()
        txList.push({
          id: d.id,
          ...data,
          date: data.createdAt?.toDate?.()?.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) || 'Recent',
        })
      })
      setTransactions(txList.length > 0 ? txList : dummyTransactions)
    } catch (err) {
      setTransactions(dummyTransactions)
    } finally { setLoading(false) }
  }, [])

  useEffect(() => { loadData() }, [])
  const onRefresh = async () => { setRefreshing(true); await loadData(); setRefreshing(false) }

  const filtered = filter === 'All'
    ? transactions
    : transactions.filter(tx => tx.type === filter.toLowerCase())

  const renderTransaction = ({ item, index }: { item: any, index: number }) => {
    const typeInfo = getTypeIcon(item.type)
    const isPositive = item.amount > 0

    return (
      <Animated.View entering={FadeInUp.delay(index * 40).duration(400)}>
        <View style={styles.txCard}>
          <View style={[styles.txTypeIcon, { backgroundColor: typeInfo.bg }]}>
            <Ionicons name={typeInfo.icon as any} size={18} color={typeInfo.color} />
          </View>
          <View style={styles.txInfo}>
            <Text style={styles.txDesc} numberOfLines={1}>{item.description}</Text>
            <View style={styles.txMetaRow}>
              <Text style={styles.txDate}>{item.date}</Text>
              {item.status === 'processing' && (
                <View style={styles.processingTag}>
                  <View style={styles.processingDot} />
                  <Text style={styles.processingText}>Processing</Text>
                </View>
              )}
            </View>
          </View>
          <View style={styles.txRight}>
            <Text style={[styles.txAmount, { color: isPositive ? colors.green : colors.red }]}>
              {isPositive ? '+' : ''}{item.amount.toLocaleString()} {item.currency}
            </Text>
            <Text style={styles.txUsd}>
              ${Math.abs(item.amount * BRS_PRICE).toFixed(2)}
            </Text>
          </View>
        </View>
      </Animated.View>
    )
  }

  return (
    <LinearGradient colors={colors.gradientScreen} style={styles.container}>
      {/* Header */}
      <Animated.View entering={FadeInDown.duration(500)} style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={20} color={colors.textSecondary} />
        </TouchableOpacity>
        <Text style={styles.title}>Transactions</Text>
        <TouchableOpacity style={styles.backBtn}>
          <Ionicons name="search-outline" size={20} color={colors.textSecondary} />
        </TouchableOpacity>
      </Animated.View>

      {/* Filters */}
      <Animated.View entering={FadeInDown.delay(100).duration(500)}>
        <FlatList
          horizontal
          showsHorizontalScrollIndicator={false}
          data={filterOptions}
          keyExtractor={item => item}
          contentContainerStyle={styles.filterList}
          renderItem={({ item }) => (
            <TouchableOpacity onPress={() => setFilter(item)}>
              <View style={[styles.filterChip, filter === item && styles.filterChipActive]}>
                <Text style={[styles.filterText, filter === item && styles.filterTextActive]}>{item}</Text>
              </View>
            </TouchableOpacity>
          )}
        />
      </Animated.View>

      {/* Summary */}
      <Animated.View entering={FadeInUp.delay(150).duration(500)} style={styles.summaryWrap}>
        <View style={styles.summaryCard}>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryLabel}>Total In</Text>
            <Text style={[styles.summaryValue, { color: colors.green }]}>
              +{filtered.filter(t => t.amount > 0).reduce((s, t) => s + t.amount, 0).toLocaleString()} BRS
            </Text>
          </View>
          <View style={styles.summaryDivider} />
          <View style={styles.summaryItem}>
            <Text style={styles.summaryLabel}>Total Out</Text>
            <Text style={[styles.summaryValue, { color: colors.red }]}>
              {filtered.filter(t => t.amount < 0).reduce((s, t) => s + t.amount, 0).toLocaleString()} BRS
            </Text>
          </View>
          <View style={styles.summaryDivider} />
          <View style={styles.summaryItem}>
            <Text style={styles.summaryLabel}>Count</Text>
            <Text style={styles.summaryValue}>{filtered.length}</Text>
          </View>
        </View>
      </Animated.View>

      {/* Transaction List */}
      {loading ? (
        <View style={styles.loadingWrap}>
          <ActivityIndicator color={colors.primary} size="large" />
        </View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={item => item.id}
          renderItem={renderTransaction}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
          ListEmptyComponent={() => (
            <View style={styles.emptyWrap}>
              <Ionicons name="receipt-outline" size={48} color={colors.textMuted} />
              <Text style={styles.emptyText}>No transactions found</Text>
            </View>
          )}
        />
      )}
    </LinearGradient>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1 },

  header: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: spacing.xl, paddingTop: 56,
    marginBottom: spacing.lg,
  },
  backBtn: {
    ...neu.iconCircle,
    width: 38, height: 38, borderRadius: 19,
    justifyContent: 'center', alignItems: 'center',
  },
  title: { flex: 1, color: colors.white, fontSize: 20, fontWeight: '700', textAlign: 'center' },

  // Filters
  filterList: { paddingHorizontal: spacing.xl, gap: spacing.sm, marginBottom: spacing.lg },
  filterChip: {
    ...neu.inset,
    paddingHorizontal: spacing.lg, paddingVertical: spacing.sm,
  },
  filterChipActive: {
    backgroundColor: colors.primarySoft,
    borderColor: colors.primary,
  },
  filterText: { color: colors.textMuted, fontSize: 12, fontWeight: '600' },
  filterTextActive: { color: colors.primary },

  // Summary
  summaryWrap: { paddingHorizontal: spacing.xl, marginBottom: spacing.lg },
  summaryCard: {
    ...neu.inset,
    flexDirection: 'row', padding: spacing.lg,
  },
  summaryItem: { flex: 1, alignItems: 'center', gap: spacing.xxs },
  summaryLabel: { color: colors.textMuted, fontSize: 10, fontWeight: '600' },
  summaryValue: { color: colors.white, fontSize: 12, fontWeight: '700' },
  summaryDivider: { width: 1, backgroundColor: 'rgba(255,255,255,0.06)' },

  // Transaction Cards
  listContent: { paddingHorizontal: spacing.xl, paddingBottom: 40 },
  txCard: {
    ...neu.cardSoft,
    flexDirection: 'row', alignItems: 'center',
    padding: spacing.lg, marginBottom: spacing.sm,
  },
  txTypeIcon: {
    width: 40, height: 40, borderRadius: 20,
    justifyContent: 'center', alignItems: 'center',
    marginRight: spacing.md,
  },
  txInfo: { flex: 1 },
  txDesc: { color: colors.white, fontSize: 14, fontWeight: '600' },
  txMetaRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginTop: 2 },
  txDate: { color: colors.textMuted, fontSize: 11 },
  processingTag: {
    flexDirection: 'row', alignItems: 'center', gap: 3,
    backgroundColor: colors.orangeSoft,
    paddingHorizontal: spacing.sm, paddingVertical: 1,
    borderRadius: radius.xs,
  },
  processingDot: { width: 4, height: 4, borderRadius: 2, backgroundColor: colors.orange },
  processingText: { color: colors.orange, fontSize: 9, fontWeight: '600' },
  txRight: { alignItems: 'flex-end' },
  txAmount: { fontSize: 13, fontWeight: '700' },
  txUsd: { color: colors.textMuted, fontSize: 10, marginTop: 1 },

  // Loading / Empty
  loadingWrap: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  emptyWrap: { alignItems: 'center', paddingTop: 60, gap: spacing.md },
  emptyText: { color: colors.textMuted, fontSize: 14 },
})
