import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { lumi } from '@/lib/lumi'
import {Users, Mail, Phone, Calendar, CheckCircle, XCircle} from 'lucide-react'

interface DirectReferral {
  _id: string
  username: string
  email: string
  referral_code: string
  mobile_number?: string
  created_at: string
  status: string
}

interface LevelSummary {
  level: number
  members: number
  commission: number
  totalEarnings: number
}

const COMMISSION_STRUCTURE = [
  { level: 1, commission: 2 },
  { level: 2, commission: 0.8 },
  { level: 3, commission: 0.75 },
  { level: 4, commission: 0.65 },
  { level: 5, commission: 0.55 },
  { level: 6, commission: 0.5 },
  { level: 7, commission: 0.45 },
  { level: 8, commission: 0.4 },
  { level: 9, commission: 0.35 },
  { level: 10, commission: 0.3 },
  { level: 11, commission: 0.25 },
  { level: 12, commission: 1 },
]

export default function ReferralEarnings() {
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState<'active' | 'royalty'>('active')
  const [loading, setLoading] = useState(true)
  const [directReferrals, setDirectReferrals] = useState<DirectReferral[]>([])
  const [levelSummary, setLevelSummary] = useState<LevelSummary[]>([])

  useEffect(() => {
    const loadData = async () => {
      try {
        const user = lumi.auth.user
        if (!user) {
          navigate('/auth')
          return
        }

        const response = await fetch('/functions/getUserReferralNetwork', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ user_id: user.userId }),
        })

        if (response.ok) {
          const data = await response.json()
          
          // Direct referrals (Level 1)
          setDirectReferrals(data.data?.level1Users || [])

          // Levels 2-12 summary
          const summary = COMMISSION_STRUCTURE.slice(1).map(({ level, commission }) => {
            const members = data.data?.membersByLevel?.[level] || 0
            return {
              level,
              members,
              commission,
              totalEarnings: members * commission,
            }
          })
          setLevelSummary(summary)
        }
      } catch (error) {
        console.error('Error loading referral earnings:', error)
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [navigate])

  const handleLogout = () => {
    lumi.auth.signOut()
    navigate('/')
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0B0919] flex items-center justify-center">
        <div className="text-[#00d4ff] text-xl">Loading...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#0B0919]">
      {/* Navigation */}
      <nav className="border-b border-[#00d4ff]/20 bg-[#1a1a2e]/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-8">
              <span className="text-2xl font-bold text-[#ffd700]">BHAROS</span>
              <div className="hidden md:flex space-x-6">
                <button onClick={() => navigate('/dashboard')} className="text-gray-300 hover:text-[#00d4ff] transition-colors">Dashboard</button>
                <button onClick={() => navigate('/referral-network')} className="text-gray-300 hover:text-[#00d4ff] transition-colors">Referral Network</button>
                <button onClick={() => navigate('/referral-earnings')} className="text-[#00d4ff] font-semibold">Referral Earnings</button>
              </div>
            </div>
            <button onClick={handleLogout} className="text-gray-300 hover:text-red-400 transition-colors">Logout</button>
          </div>
        </div>
      </nav>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-[#00d4ff] mb-2">Referral & Earnings</h1>
          <p className="text-gray-400">View your referral network details and commission earnings</p>
        </div>

        {/* Tabs */}
        <div className="flex space-x-4 mb-8 border-b border-[#00d4ff]/20">
          <button
            onClick={() => setActiveTab('active')}
            className={`px-6 py-3 font-semibold transition-all ${
              activeTab === 'active'
                ? 'text-[#00d4ff] border-b-2 border-[#00d4ff]'
                : 'text-gray-400 hover:text-gray-300'
            }`}
          >
            Active
          </button>
          <button
            onClick={() => setActiveTab('royalty')}
            className={`px-6 py-3 font-semibold transition-all ${
              activeTab === 'royalty'
                ? 'text-[#00d4ff] border-b-2 border-[#00d4ff]'
                : 'text-gray-400 hover:text-gray-300'
            }`}
          >
            Royalty
          </button>
        </div>

        {activeTab === 'active' && (
          <div className="space-y-8">
            {/* Level 1: Direct Referrals */}
            <div>
              <h2 className="text-2xl font-bold text-[#ffd700] mb-4">Level 1 - Direct Referrals</h2>
              {directReferrals.length === 0 ? (
                <div className="bg-[#16213e] rounded-lg p-8 border border-[#00d4ff]/20 text-center">
                  <Users className="w-12 h-12 text-gray-500 mx-auto mb-4" />
                  <p className="text-gray-400">No direct referrals yet</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {directReferrals.map((member) => (
                    <div
                      key={member._id}
                      className="bg-[#16213e] rounded-lg p-6 border border-[#00d4ff]/30 shadow-lg shadow-[#00d4ff]/10 hover:border-[#00d4ff]/50 transition-all"
                    >
                      <div className="flex justify-between items-start mb-4">
                        <div>
                          <p className="text-sm text-gray-400">Ref Code</p>
                          <p className="text-lg font-bold text-[#ffd700]">{member.referral_code}</p>
                        </div>
                        <div>
                          {member.status === 'active' ? (
                            <span className="flex items-center space-x-1 px-3 py-1 bg-green-500/20 border border-green-500 rounded-full text-green-400 text-sm">
                              <CheckCircle className="w-4 h-4" />
                              <span>Active</span>
                            </span>
                          ) : (
                            <span className="flex items-center space-x-1 px-3 py-1 bg-red-500/20 border border-red-500 rounded-full text-red-400 text-sm">
                              <XCircle className="w-4 h-4" />
                              <span>Inactive</span>
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="space-y-3">
                        <div className="flex items-center space-x-2">
                          <Users className="w-4 h-4 text-[#00d4ff]" />
                          <span className="text-gray-300">{member.username}</span>
                        </div>

                        <div className="flex items-center space-x-2">
                          <Mail className="w-4 h-4 text-[#00d4ff]" />
                          <span className="text-gray-300 text-sm">{member.email}</span>
                        </div>

                        {member.mobile_number && (
                          <div className="flex items-center space-x-2">
                            <Phone className="w-4 h-4 text-[#00d4ff]" />
                            <span className="text-gray-300 text-sm">{member.mobile_number}</span>
                          </div>
                        )}

                        <div className="flex items-center space-x-2">
                          <Calendar className="w-4 h-4 text-[#00d4ff]" />
                          <span className="text-gray-300 text-sm">
                            {new Date(member.created_at).toLocaleDateString()}
                          </span>
                        </div>

                        <div className="pt-2 border-t border-[#00d4ff]/10">
                          <span className="text-xs text-gray-400">Level: </span>
                          <span className="text-sm font-semibold text-[#00d4ff]">L1</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Levels 2-12: Summary */}
            <div>
              <h2 className="text-2xl font-bold text-[#ffd700] mb-4">Levels 2-12 Summary</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {levelSummary.map((level) => (
                  <div
                    key={level.level}
                    className="bg-[#16213e] rounded-lg p-6 border border-[#00d4ff]/20 hover:border-[#00d4ff]/40 transition-all shadow-lg shadow-[#00d4ff]/5"
                  >
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-bold text-white">Level {level.level}</h3>
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#00d4ff] to-[#0ff] flex items-center justify-center">
                        <span className="text-sm font-bold text-[#0B0919]">{level.level}</span>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-gray-400 text-sm">Members</span>
                        <div className="flex items-center space-x-1">
                          <Users className="w-4 h-4 text-[#00d4ff]" />
                          <span className="text-white font-semibold">{level.members}</span>
                        </div>
                      </div>

                      <div className="flex justify-between items-center">
                        <span className="text-gray-400 text-sm">Earnings</span>
                        <span className="text-[#ffd700] font-semibold">${level.totalEarnings.toFixed(2)}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'royalty' && (
          <div className="bg-[#16213e] rounded-lg p-8 border border-[#00d4ff]/20 text-center">
            <p className="text-gray-400">Royalty earnings feature coming soon</p>
          </div>
        )}
      </div>
    </div>
  )
}
