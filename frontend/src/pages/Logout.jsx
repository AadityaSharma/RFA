import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'

export default function Logout() {
  const nav = useNavigate()

  useEffect(() => {
    localStorage.removeItem('token')
    nav('/login', { replace: true })
  }, [nav])

  return null
}