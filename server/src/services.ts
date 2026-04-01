// 服务数据（与前端 src/data/services.ts 保持同步）

export interface BasicService {
  id: string
  name: string
  durationMins: number
}

export interface AddonService {
  id: string
  name: string
}

export const BASIC_SERVICES: BasicService[] = [
  { id: 'basic-1', name: '本甲单色（含建构）',  durationMins: 75  },
  { id: 'basic-2', name: '延长单色（包含建构）', durationMins: 105 },
  { id: 'basic-3', name: '延长二次利用',         durationMins: 90  },
]

export const ADDON_SERVICES: AddonService[] = [
  { id: 'addon-1',  name: '本店卸甲油胶本甲'          },
  { id: 'addon-2',  name: '本店卸甲油胶延长'          },
  { id: 'addon-3',  name: '非本店卸甲油胶本甲'        },
  { id: 'addon-4',  name: '非本店卸甲油胶延长'        },
  { id: 'addon-5',  name: '卸水晶本甲'                },
  { id: 'addon-6',  name: '卸水晶延长'                },
  { id: 'addon-7',  name: '单色渐变'                  },
  { id: 'addon-8',  name: '修补指甲'                  },
  { id: 'addon-9',  name: '单钻'                      },
  { id: 'addon-10', name: '钻球'                      },
  { id: 'addon-11', name: '饰品'                      },
  { id: 'addon-12', name: '啃咬甲（视严重程度加收）'  },
]

export const TIME_SLOTS = [
  '9:30 AM', '10:00 AM', '10:30 AM', '11:00 AM', '11:30 AM',
  '12:00 PM', '12:30 PM',
  '1:00 PM', '1:30 PM', '2:00 PM', '2:30 PM', '3:00 PM', '3:30 PM',
  '4:00 PM', '4:30 PM', '5:00 PM', '5:30 PM',
]

/** 将时间槽字符串转为当天分钟数，用于冲突检测 */
export function slotToMinutes(slot: string): number {
  const [time, period] = slot.split(' ')
  const [h, m] = time.split(':').map(Number)
  let hours = h
  if (period === 'PM' && hours !== 12) hours += 12
  if (period === 'AM' && hours === 12) hours = 0
  return hours * 60 + m
}
