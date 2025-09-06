import { useContext, useEffect, useMemo, useState } from 'react'
import axios from 'axios'
import AuthDataContext from '../context/AuthDataContext'
import SocketDataContext from '../context/SocketDataContext'

function StatCard({ title, value, sub }) {
  return (
    <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
      <div className="text-sm text-gray-500">{title}</div>
      <div className="text-2xl font-bold text-[#172519]">{value}</div>
      {sub ? <div className="text-xs text-gray-400 mt-1">{sub}</div> : null}
    </div>
  )
}

export default function UserProfile() {
  const { user } = useContext(AuthDataContext)
  const { socket } = useContext(SocketDataContext)
  const BASE_URL = import.meta.env.VITE_BASE_URL

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [profile, setProfile] = useState(null)

  const token = useMemo(() => localStorage.getItem('token'), [])

  const fetchProfile = async () => {
    try {
      setLoading(true)
      setError('')
      const res = await axios.get(`${BASE_URL}/auth/profile`, {
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
        withCredentials: true,
      })
      setProfile(res.data?.user || null)
    } catch (e) {
      setError(e?.response?.data?.message || e?.message || 'Failed to load profile')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchProfile()
    // live updates from backend eco stats
    if (!socket) return
    const handler = (payload) => {
      // Merge eco fields when updated
      setProfile((prev) => {
        if (!prev) return prev
        return {
          ...prev,
          ecoStreak: payload?.ecoStreak ?? prev.ecoStreak,
          lastEcoRideAt: payload?.lastEcoRideAt ?? prev.lastEcoRideAt,
          totalEcoRides: payload?.totalEcoRides ?? prev.totalEcoRides,
          co2SavedKg: payload?.co2SavedKg ?? prev.co2SavedKg,
          badges: payload?.badges ?? prev.badges,
        }
      })
    }
    socket.on('eco-stats-updated', handler)
    return () => {
      socket.off('eco-stats-updated', handler)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [socket])

  const badges = profile?.badges || []

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-extrabold text-[#172519]">Your Profile</h1>
      <p className="text-gray-600 mt-1">Welcome{user?.name ? `, ${user.name}` : ''}. Track your eco journey.</p>

      {loading ? (
        <div className="mt-8 text-gray-500">Loading...</div>
      ) : error ? (
        <div className="mt-8 text-red-600">{error}</div>
      ) : (
        <div className="mt-8 space-y-8">
          <section>
            <h2 className="text-xl font-bold mb-3">Account</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <StatCard title="Name" value={profile?.name || '-'} />
              <StatCard title="Username" value={profile?.username || '-'} />
              <StatCard title="Phone" value={profile?.phone || '-'} />
            </div>
          </section>

          <section>
            <h2 className="text-xl font-bold mb-3">Eco Stats</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <StatCard title="Eco Streak" value={`${profile?.ecoStreak || 0} days`} sub="Consecutive days with an eco ride" />
              <StatCard title="Total Eco Rides" value={profile?.totalEcoRides || 0} />
              <StatCard title="CO₂ Saved" value={`${(profile?.co2SavedKg || 0).toFixed(2)} kg`} />
              <StatCard title="Rewards Points" value={profile?.rewardsPoints || 0} />
            </div>
          </section>

          <section>
            <h2 className="text-xl font-bold mb-3">Badges</h2>
            {badges.length === 0 ? (
              <div className="text-gray-500">No badges yet. Take eco rides to earn your first Leaf badge!</div>
            ) : (
              <div className="flex flex-wrap gap-2">
                {badges.map((b) => (
                  <span key={b} className="inline-flex items-center rounded-full bg-emerald-100 text-emerald-800 px-3 py-1 text-sm font-semibold border border-emerald-200">
                    {b}
                  </span>
                ))}
              </div>
            )}
          </section>
        </div>
      )}
    </div>
  )
}
