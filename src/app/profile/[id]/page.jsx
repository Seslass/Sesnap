import ProfilePage from '@/components/ProfilePage'

export default function Profile({ params }) {
  return <ProfilePage userId={params.id} />
}
