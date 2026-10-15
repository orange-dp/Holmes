import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { getToken, setToken } from '../api/client.js'
import * as authApi from '../api/auth.js'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  // 初始化：如果有 token，获取用户信息
  useEffect(() => {
    const token = getToken()
    if (!token) {
      setLoading(false)
      return
    }

    authApi
      .getMe()
      .then((data) => {
        setUser(data.user)
      })
      .catch(() => {
        setToken(null)
      })
      .finally(() => {
        setLoading(false)
      })
  }, [])

  // 登录
  const login = useCallback(async (username, password) => {
    const data = await authApi.login(username, password)
    setToken(data.token)
    setUser(data.user)
    return data.user
  }, [])

  // 注册
  const register = useCallback(async (username, password, nickname) => {
    const data = await authApi.register(username, password, nickname)
    setToken(data.token)
    setUser(data.user)
    return data.user
  }, [])

  // 登出
  const logout = useCallback(() => {
    setToken(null)
    setUser(null)
  }, [])

  // 更新昵称
  const updateNickname = useCallback(async (nickname) => {
    const data = await authApi.updateNickname(nickname)
    setUser(data.user)
    return data.user
  }, [])

  const value = {
    user,
    loading,
    isAuthed: !!user,
    login,
    register,
    logout,
    updateNickname,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

/**
 * 使用 Auth Context
 */
export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) {
    throw new Error('useAuth 必须在 AuthProvider 内使用')
  }
  return ctx
}