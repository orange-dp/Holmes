/**
 * 格式化日期为 YYYY/MM/DD HH:mm:ss
 */
export function formatTime(date) {
  const year = date.getFullYear()
  const month = date.getMonth() + 1
  const day = date.getDate()
  const hour = date.getHours()
  const minute = date.getMinutes()
  const second = date.getSeconds()

  const formatNumber = (n) => {
    n = n.toString()
    return n[1] ? n : '0' + n
  }

  return (
    [year, month, day].map(formatNumber).join('/') +
    ' ' +
    [hour, minute, second].map(formatNumber).join(':')
  )
}

/**
 * localStorage 读取
 */
export function getStorage(key) {
  const value = localStorage.getItem(key)
  try {
    return JSON.parse(value)
  } catch {
    return value
  }
}

/**
 * localStorage 写入
 */
export function setStorage(key, data) {
  localStorage.setItem(key, JSON.stringify(data))
}