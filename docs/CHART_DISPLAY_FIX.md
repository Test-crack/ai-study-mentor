# Chart Display Fix

## Issues Fixed

### 1. WPM Display
**Problem:** WPM values were showing with "%" symbol in tooltips
**Solution:** 
- Added logic to detect WPM metrics by checking `dataKey === 'wpm'` or name contains "wpm"/"words per minute"
- WPM values now show with "WPM" suffix instead of "%"

### 2. Score Normalization
**Problem:** Scores were being multiplied by 100 even when already in percentage format
**Solution:**
- Added `normalizeScore()` helper function that checks if value is ≤ 1 (decimal format)
- Only multiplies by 100 if in decimal format (0-1)
- If already percentage (>1), keeps as-is

### 3. Y-Axis Labels
**Enhancement:** Added axis labels to clarify units
- Speed charts show "WPM" label on Y-axis
- Percentage charts show "%" label on Y-axis
- Automatically detects chart type based on data keys

## Code Changes

### CustomTooltip Enhancement
```typescript
const CustomTooltip = ({ active, payload, label }: any) => {
  // ... 
  const isWPM = entry.dataKey === 'wpm' || 
                entry.name.toLowerCase().includes('wpm') || 
                entry.name.toLowerCase().includes('words per minute');
  
  return (
    <span>{entry.value}{isWPM ? ' WPM' : '%'}</span>
  );
};
```

### Data Normalization
```typescript
const normalizeScore = (score: number) => 
  score <= 1 ? Math.round(score * 100) : Math.round(score);

const chartData = history.map(item => ({
  wpm: Math.round(item.weightedWPM),           // No conversion
  accuracy: normalizeScore(item.accuracy),      // Smart conversion
  retention: normalizeScore(item.retention),    // Smart conversion
  // ...
}));
```

### Y-Axis Labels
```typescript
const isWPMChart = dataKeys.some(dk => dk.key === 'wpm');

<YAxis 
  label={isWPMChart 
    ? { value: 'WPM', angle: -90, position: 'insideLeft' } 
    : { value: '%', angle: -90, position: 'insideLeft' }
  }
/>
```

## Chart Types Affected

### Overview Tab
- Reading Speed (WPM) - Shows WPM values
- Accuracy (%) - Shows percentage values
- Speed Learning (%) - Shows percentage values

### Speed Tab
- Words Per Minute - Shows WPM values with "WPM" label

### Comprehension Tab
- Accuracy (%) - Shows percentage values
- Retention (%) - Shows percentage values

### Focus Tab
- Focus Ratio (%) - Shows percentage values
- Speed Learning Score (%) - Shows percentage values

## Testing

To verify the fixes:
1. ✅ Hover over WPM data points - should show "XXX WPM"
2. ✅ Hover over percentage data points - should show "XX%"
3. ✅ Check Y-axis labels - "WPM" for speed charts, "%" for others
4. ✅ Verify values are in correct range (WPM: 100-400, %: 0-100)

## Example Display

**Speed Chart:**
- Tooltip: "225 WPM"
- Y-axis: "WPM"
- Values: 150, 200, 250, 300

**Accuracy Chart:**
- Tooltip: "92%"
- Y-axis: "%"
- Values: 0, 25, 50, 75, 100
