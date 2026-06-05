// Inline coloured tile used wherever image_url is absent.
// No network requests — pure CSS + inline text.

interface Props {
  district: string
  className?: string
}

const DISTRICT_STYLE: Record<string, { bg: string; text: string }> = {
  'Huangpu':   { bg: '#EF4444', text: '黄浦' },
  'Xuhui':     { bg: '#10B981', text: '徐汇' },
  "Jing'an":   { bg: '#F59E0B', text: '静安' },
  'Pudong':    { bg: '#3B82F6', text: '浦东' },
  'Changning': { bg: '#8B5CF6', text: '长宁' },
  'Putuo':     { bg: '#EC4899', text: '普陀' },
  'Hongkou':   { bg: '#06B6D4', text: '虹口' },
  'Yangpu':    { bg: '#84CC16', text: '杨浦' },
  'Minhang':   { bg: '#F97316', text: '闵行' },
  'Songjiang': { bg: '#6366F1', text: '松江' },
  'Jinshan':   { bg: '#14B8A6', text: '金山' },
  'Baoshan':   { bg: '#A78BFA', text: '宝山' },
  'Jiading':   { bg: '#34D399', text: '嘉定' },
  'Qingpu':    { bg: '#FB923C', text: '青浦' },
  'Fengxian':  { bg: '#60A5FA', text: '奉贤' },
  'Chongming': { bg: '#4ADE80', text: '崇明' },
}

const FALLBACK = { bg: '#6B7280', text: '上海' }

export function DistrictPlaceholder({ district, className = '' }: Props) {
  const style = DISTRICT_STYLE[district] ?? FALLBACK

  return (
    <div
      className={`flex items-center justify-center text-white font-bold text-xl select-none ${className}`}
      style={{ backgroundColor: style.bg }}
      aria-label={`${district} district placeholder`}
    >
      {style.text}
    </div>
  )
}
