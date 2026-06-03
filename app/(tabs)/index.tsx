import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Haptics from 'expo-haptics';
import { useEffect, useMemo, useRef, useState } from 'react';
import {
  Alert,
  Platform,
  Pressable,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';

import {
  answerCurrentChallenge,
  calculateProgress,
  clearAnswer,
  createInitialState,
  getCurrentChallenge,
  getCurrentLesson,
  LingoTrailState,
  loadState,
  removeLastWord,
  selectWord,
  serializeReport,
  skipChallenge,
  switchLanguage,
} from '@/lib/lingotrail-domain';

const STORAGE_KEY = 'lingotrail-state-v1';

const colors = {
  bg: '#f4fbf7',
  panel: '#ffffff',
  ink: '#1c2b2a',
  muted: '#6b7d7a',
  line: '#dcebe5',
  mint: '#24b87a',
  mintDark: '#128454',
  mintSoft: '#dff8ec',
  sky: '#3ba6ff',
  skySoft: '#e4f3ff',
  coral: '#ff6b57',
  coralSoft: '#ffe8e3',
  gold: '#f5b83d',
};

export default function HomeScreen() {
  const { width } = useWindowDimensions();
  const hydrated = useRef(false);
  const [state, setState] = useState(() => createInitialState());
  const [report, setReport] = useState('');
  const progress = useMemo(() => calculateProgress(state), [state]);
  const lesson = getCurrentLesson(state);
  const challenge = getCurrentChallenge(state);
  const rtl = state.profile.language === 'Hebrew';
  const isWide = width >= 920;

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY)
      .then((storedValue) => {
        hydrated.current = true;
        setState(loadState(storedValue));
      })
      .catch(() => {
        hydrated.current = true;
      });
  }, []);

  useEffect(() => {
    if (!hydrated.current) return;
    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(state)).catch(() => {});
  }, [state]);

  const mutate = (updater: (current: LingoTrailState) => LingoTrailState) => {
    if (Platform.OS === 'ios') {
      Haptics.selectionAsync();
    }
    setState((current) => updater(current));
  };

  const selectedCounts = state.session.answer.reduce<Record<string, number>>((counts, word) => {
    counts[word] = (counts[word] ?? 0) + 1;
    return counts;
  }, {});

  const exportProgress = async () => {
    const value = JSON.stringify(serializeReport(state), null, 2);
    setReport(value);
    try {
      await Share.share({ title: 'LingoTrail progress', message: value });
    } catch {
      Alert.alert('Progress report', value);
    }
  };

  return (
    <ScrollView
      contentInsetAdjustmentBehavior="automatic"
      style={styles.screen}
      contentContainerStyle={styles.content}>
      <View style={styles.topbar}>
        <View style={styles.brandRow}>
          <View style={styles.logoMark}>
            <Text style={styles.logoText}>L</Text>
          </View>
          <View>
            <Text selectable style={styles.brandName}>
              LingoTrail
            </Text>
            <Text selectable style={styles.muted}>
              Learn {state.profile.language}
            </Text>
          </View>
        </View>

        <View style={styles.statRail}>
          <Stat icon="local-fire-department" label="Streak" value={state.profile.streak} />
          <Stat icon="favorite" label="Hearts" value={state.profile.hearts} />
          <Stat icon="diamond" label="Gems" value={state.profile.gems} />
          <Stat icon="bolt" label="XP" value={state.profile.xp} />
        </View>
      </View>

      <View style={styles.languageRail}>
        {state.availableLanguages.map((language) => (
          <PillButton
            key={language}
            label={language}
            selected={language === state.profile.language}
            onPress={() => mutate((current) => switchLanguage(current, language))}
          />
        ))}
        <IconButton icon="ios-share" label="Export" onPress={exportProgress} />
        <IconButton
          icon="restart-alt"
          label="Reset"
          onPress={() => mutate(() => createInitialState(state.profile.language))}
        />
      </View>

      <View style={[styles.workspace, isWide && styles.workspaceWide]}>
        <View style={[styles.panel, isWide && styles.pathPanelWide]}>
          <View style={styles.sectionHeader}>
            <View style={styles.flexShrink}>
              <Text selectable style={styles.title}>
                Learn {state.profile.language}
              </Text>
              <Text selectable style={styles.muted}>
                {progress.percent}% complete · Current: {progress.activeLesson}
              </Text>
            </View>
            <Text selectable style={styles.levelPill}>
              {progress.completedLessons}/{progress.totalLessons}
            </Text>
          </View>

          <View style={styles.trail}>
            {state.lessons.map((item, index) => (
              <View key={item.id} style={styles.lessonNode}>
                <View
                  style={[
                    styles.nodeButton,
                    item.status === 'active' && styles.nodeActive,
                    item.status === 'complete' && styles.nodeComplete,
                    item.status === 'locked' && styles.nodeLocked,
                  ]}>
                  {item.status === 'complete' ? (
                    <MaterialIcons name="check" size={22} color="#ffffff" />
                  ) : item.status === 'locked' ? (
                    <MaterialIcons name="lock" size={20} color={colors.muted} />
                  ) : (
                    <Text style={styles.nodeNumber}>{index + 1}</Text>
                  )}
                </View>
                <View style={styles.flexShrink}>
                  <Text selectable style={styles.lessonTitle}>
                    {item.title}
                  </Text>
                  <Text selectable style={styles.lessonMeta}>
                    {item.status === 'active' ? 'Current lesson' : item.label}
                  </Text>
                </View>
              </View>
            ))}
          </View>
        </View>

        <View style={[styles.panel, styles.exercisePanel, isWide && styles.exercisePanelWide]}>
          <View style={styles.progressTrack}>
            <View style={[styles.progressFill, { width: `${((state.session.challengeIndex + 1) / lesson.challenges.length) * 100}%` }]} />
          </View>

          <View style={styles.exerciseHeader}>
            <Text selectable style={styles.badge}>
              {lesson.title}
            </Text>
            <Text selectable style={styles.muted}>
              {state.session.challengeIndex + 1}/{lesson.challenges.length}
            </Text>
          </View>

          <Text selectable style={styles.exerciseTitle}>
            {challenge.instruction}
          </Text>
          <Text selectable style={styles.prompt}>
            {challenge.prompt}
          </Text>

          <View style={[styles.answerBox, rtl && styles.rtlBox]}>
            <Text selectable style={[styles.answerText, !state.session.answer.length && styles.placeholderText, rtl && styles.rtlText]}>
              {state.session.answer.length ? state.session.answer.join(' ') : 'Build your answer'}
            </Text>
          </View>

          <View style={[styles.tileGrid, rtl && styles.rtlGrid]}>
            {challenge.tiles.map((word, index) => {
              const used = (selectedCounts[word] ?? 0) >= challenge.tiles.filter((tile) => tile === word).length;
              return (
                <Pressable
                  key={`${word}-${index}`}
                  disabled={used}
                  onPress={() => mutate((current) => selectWord(current, word))}
                  style={({ pressed }) => [
                    styles.wordTile,
                    used && styles.wordTileUsed,
                    pressed && !used && styles.pressed,
                  ]}>
                  <Text selectable style={[styles.wordTileText, used && styles.wordTileTextUsed]}>
                    {word}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          {state.session.feedback ? (
            <View style={[styles.feedback, styles[`${state.session.feedback.type}Feedback`]]}>
              <Text selectable style={styles.feedbackText}>
                {state.session.feedback.message}
              </Text>
            </View>
          ) : null}

          <View style={styles.actionRow}>
            <ActionButton label="Undo" variant="ghost" onPress={() => mutate(removeLastWord)} />
            <ActionButton label="Clear" variant="ghost" onPress={() => mutate(clearAnswer)} />
            <ActionButton label="Skip" variant="secondary" onPress={() => mutate(skipChallenge)} />
            <ActionButton label="Check" variant="primary" onPress={() => mutate(answerCurrentChallenge)} />
          </View>
        </View>

        <View style={[styles.sideStack, isWide && styles.sideStackWide]}>
          <View style={styles.panel}>
            <Text selectable style={styles.sideTitle}>
              Daily quests
            </Text>
            {state.quests.map((quest) => (
              <View key={quest.id} style={styles.questRow}>
                <View style={styles.questCopy}>
                  <Text selectable style={styles.questLabel}>
                    {quest.label}
                  </Text>
                  <Text selectable style={styles.lessonMeta}>
                    {quest.progress}/{quest.target}
                  </Text>
                </View>
                <View style={styles.miniBar}>
                  <View style={[styles.miniBarFill, { width: `${Math.min(Math.round((quest.progress / quest.target) * 100), 100)}%` }]} />
                </View>
              </View>
            ))}
          </View>

          <View style={styles.panel}>
            <Text selectable style={styles.sideTitle}>
              Progress
            </Text>
            <Metric label="Course" value={`${progress.percent}%`} />
            <Metric label="Daily XP" value={`${state.quests[0].progress}/${state.quests[0].target}`} />
            <Metric label="Hearts" value={`${state.profile.hearts}/5`} />
          </View>

          <View style={styles.panel}>
            <Text selectable style={styles.sideTitle}>
              Leaderboard
            </Text>
            {state.leaderboard.map((row, index) => (
              <View key={row.name} style={styles.rankRow}>
                <Text selectable style={styles.rank}>
                  {index + 1}
                </Text>
                <Text selectable style={styles.rankName}>
                  {row.name}
                </Text>
                <Text selectable style={styles.rankXp}>
                  {row.xp} XP
                </Text>
              </View>
            ))}
          </View>
        </View>
      </View>

      {report ? (
        <View style={styles.reportPanel}>
          <Text selectable style={styles.sideTitle}>
            Progress report
          </Text>
          <Text selectable style={styles.reportText}>
            {report}
          </Text>
        </View>
      ) : null}
    </ScrollView>
  );
}

function Stat({ icon, label, value }: { icon: keyof typeof MaterialIcons.glyphMap; label: string; value: number }) {
  return (
    <View style={styles.stat}>
      <MaterialIcons name={icon} size={18} color={colors.mintDark} />
      <Text selectable style={styles.statText}>
        {value}
      </Text>
      <Text selectable style={styles.statLabel}>
        {label}
      </Text>
    </View>
  );
}

function PillButton({ label, selected, onPress }: { label: string; selected: boolean; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.pillButton, selected && styles.pillButtonSelected, pressed && styles.pressed]}>
      <Text selectable style={[styles.pillButtonText, selected && styles.pillButtonTextSelected]}>
        {label}
      </Text>
    </Pressable>
  );
}

function IconButton({ icon, label, onPress }: { icon: keyof typeof MaterialIcons.glyphMap; label: string; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} accessibilityLabel={label} style={({ pressed }) => [styles.iconButton, pressed && styles.pressed]}>
      <MaterialIcons name={icon} size={20} color={colors.ink} />
    </Pressable>
  );
}

function ActionButton({
  label,
  variant,
  onPress,
}: {
  label: string;
  variant: 'primary' | 'secondary' | 'ghost';
  onPress: () => void;
}) {
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.actionButton, styles[`${variant}Button`], pressed && styles.pressed]}>
      <Text selectable style={[styles.actionButtonText, variant === 'primary' && styles.primaryButtonText]}>
        {label}
      </Text>
    </Pressable>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.metric}>
      <Text selectable style={styles.muted}>
        {label}
      </Text>
      <Text selectable style={styles.metricValue}>
        {value}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  content: {
    gap: 16,
    padding: 16,
    paddingBottom: 32,
  },
  topbar: {
    alignItems: 'flex-start',
    backgroundColor: 'rgba(255,255,255,0.9)',
    borderColor: colors.line,
    borderRadius: 8,
    borderWidth: 1,
    boxShadow: '0 14px 32px rgba(30, 84, 69, 0.10)',
    gap: 14,
    padding: 16,
  },
  brandRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 12,
  },
  logoMark: {
    alignItems: 'center',
    backgroundColor: colors.mint,
    borderRadius: 12,
    height: 42,
    justifyContent: 'center',
    width: 42,
  },
  logoText: {
    color: '#ffffff',
    fontSize: 22,
    fontWeight: '900',
  },
  brandName: {
    color: colors.ink,
    fontSize: 22,
    fontWeight: '900',
  },
  muted: {
    color: colors.muted,
    fontSize: 13,
  },
  statRail: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  stat: {
    alignItems: 'center',
    backgroundColor: colors.panel,
    borderColor: colors.line,
    borderRadius: 8,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 5,
    minHeight: 36,
    paddingHorizontal: 9,
  },
  statText: {
    color: colors.ink,
    fontSize: 14,
    fontVariant: ['tabular-nums'],
    fontWeight: '900',
  },
  statLabel: {
    color: colors.muted,
    fontSize: 11,
    fontWeight: '700',
  },
  languageRail: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  pillButton: {
    alignItems: 'center',
    backgroundColor: colors.panel,
    borderColor: colors.line,
    borderRadius: 8,
    borderWidth: 1,
    minHeight: 38,
    paddingHorizontal: 14,
    justifyContent: 'center',
  },
  pillButtonSelected: {
    backgroundColor: colors.mintSoft,
    borderColor: '#bdebd6',
  },
  pillButtonText: {
    color: colors.muted,
    fontWeight: '900',
  },
  pillButtonTextSelected: {
    color: colors.mintDark,
  },
  iconButton: {
    alignItems: 'center',
    backgroundColor: colors.panel,
    borderColor: colors.line,
    borderRadius: 8,
    borderWidth: 1,
    height: 38,
    justifyContent: 'center',
    width: 42,
  },
  workspace: {
    gap: 16,
  },
  workspaceWide: {
    alignItems: 'flex-start',
    flexDirection: 'row',
  },
  panel: {
    backgroundColor: colors.panel,
    borderColor: colors.line,
    borderRadius: 8,
    borderWidth: 1,
    boxShadow: '0 18px 45px rgba(30, 84, 69, 0.12)',
    gap: 16,
    padding: 16,
  },
  pathPanelWide: {
    width: 320,
  },
  exercisePanel: {
    gap: 18,
  },
  exercisePanelWide: {
    flex: 1,
    minWidth: 360,
  },
  sideStack: {
    gap: 16,
  },
  sideStackWide: {
    width: 300,
  },
  sectionHeader: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    gap: 12,
    justifyContent: 'space-between',
  },
  flexShrink: {
    flexShrink: 1,
  },
  title: {
    color: colors.ink,
    fontSize: 26,
    fontWeight: '900',
    lineHeight: 31,
  },
  levelPill: {
    backgroundColor: colors.mintSoft,
    borderRadius: 8,
    color: colors.mintDark,
    fontSize: 13,
    fontVariant: ['tabular-nums'],
    fontWeight: '900',
    overflow: 'hidden',
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  trail: {
    gap: 14,
  },
  lessonNode: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 12,
    minHeight: 56,
  },
  nodeButton: {
    alignItems: 'center',
    borderRadius: 18,
    height: 44,
    justifyContent: 'center',
    width: 44,
  },
  nodeActive: {
    backgroundColor: colors.mint,
  },
  nodeComplete: {
    backgroundColor: colors.sky,
  },
  nodeLocked: {
    backgroundColor: '#eef5f2',
  },
  nodeNumber: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '900',
  },
  lessonTitle: {
    color: colors.ink,
    fontSize: 16,
    fontWeight: '900',
  },
  lessonMeta: {
    color: colors.muted,
    fontSize: 12,
    fontWeight: '700',
  },
  progressTrack: {
    backgroundColor: colors.mintSoft,
    borderRadius: 999,
    height: 9,
    overflow: 'hidden',
  },
  progressFill: {
    backgroundColor: colors.mint,
    height: '100%',
  },
  exerciseHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  badge: {
    backgroundColor: colors.mintSoft,
    borderRadius: 8,
    color: colors.mintDark,
    fontSize: 13,
    fontWeight: '900',
    overflow: 'hidden',
    paddingHorizontal: 10,
    paddingVertical: 7,
  },
  exerciseTitle: {
    color: colors.ink,
    fontSize: 25,
    fontWeight: '900',
    lineHeight: 31,
  },
  prompt: {
    color: colors.ink,
    fontSize: 18,
    fontWeight: '800',
  },
  answerBox: {
    backgroundColor: '#f8fcfa',
    borderColor: colors.line,
    borderRadius: 8,
    borderWidth: 1,
    minHeight: 64,
    justifyContent: 'center',
    padding: 14,
  },
  rtlBox: {
    alignItems: 'flex-end',
  },
  answerText: {
    color: colors.ink,
    fontSize: 19,
    fontWeight: '900',
  },
  placeholderText: {
    color: colors.muted,
  },
  rtlText: {
    textAlign: 'right',
    writingDirection: 'rtl',
  },
  tileGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  rtlGrid: {
    flexDirection: 'row-reverse',
  },
  wordTile: {
    backgroundColor: colors.skySoft,
    borderColor: '#b9ddff',
    borderRadius: 8,
    borderWidth: 1,
    minHeight: 44,
    paddingHorizontal: 14,
    justifyContent: 'center',
  },
  wordTileUsed: {
    backgroundColor: '#eef2f0',
    borderColor: '#e1e8e5',
  },
  wordTileText: {
    color: colors.ink,
    fontSize: 16,
    fontWeight: '900',
  },
  wordTileTextUsed: {
    color: '#9caaa6',
  },
  feedback: {
    borderRadius: 8,
    padding: 12,
  },
  successFeedback: {
    backgroundColor: colors.mintSoft,
  },
  errorFeedback: {
    backgroundColor: colors.coralSoft,
  },
  infoFeedback: {
    backgroundColor: colors.skySoft,
  },
  feedbackText: {
    color: colors.ink,
    fontWeight: '800',
  },
  actionRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 9,
    justifyContent: 'flex-end',
  },
  actionButton: {
    alignItems: 'center',
    borderRadius: 8,
    borderWidth: 1,
    minHeight: 42,
    minWidth: 74,
    paddingHorizontal: 14,
    justifyContent: 'center',
  },
  primaryButton: {
    backgroundColor: colors.mint,
    borderColor: colors.mint,
  },
  secondaryButton: {
    backgroundColor: colors.skySoft,
    borderColor: '#b9ddff',
  },
  ghostButton: {
    backgroundColor: colors.panel,
    borderColor: colors.line,
  },
  actionButtonText: {
    color: colors.ink,
    fontWeight: '900',
  },
  primaryButtonText: {
    color: '#ffffff',
  },
  sideTitle: {
    color: colors.ink,
    fontSize: 19,
    fontWeight: '900',
  },
  questRow: {
    gap: 8,
  },
  questCopy: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 10,
  },
  questLabel: {
    color: colors.ink,
    flexShrink: 1,
    fontWeight: '900',
  },
  miniBar: {
    backgroundColor: '#edf5f1',
    borderRadius: 999,
    height: 8,
    overflow: 'hidden',
  },
  miniBarFill: {
    backgroundColor: colors.gold,
    height: '100%',
  },
  metric: {
    alignItems: 'center',
    borderBottomColor: colors.line,
    borderBottomWidth: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingBottom: 10,
  },
  metricValue: {
    color: colors.ink,
    fontVariant: ['tabular-nums'],
    fontWeight: '900',
  },
  rankRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 10,
  },
  rank: {
    backgroundColor: colors.mintSoft,
    borderRadius: 8,
    color: colors.mintDark,
    fontVariant: ['tabular-nums'],
    fontWeight: '900',
    overflow: 'hidden',
    paddingHorizontal: 9,
    paddingVertical: 5,
  },
  rankName: {
    color: colors.ink,
    flex: 1,
    fontWeight: '900',
  },
  rankXp: {
    color: colors.muted,
    fontSize: 12,
    fontVariant: ['tabular-nums'],
    fontWeight: '800',
  },
  reportPanel: {
    backgroundColor: '#f8fcfa',
    borderColor: colors.line,
    borderRadius: 8,
    borderWidth: 1,
    gap: 10,
    padding: 16,
  },
  reportText: {
    color: colors.ink,
    fontFamily: Platform.select({ ios: 'Menlo', android: 'monospace', default: 'monospace' }),
    fontSize: 12,
    lineHeight: 18,
  },
  pressed: {
    opacity: 0.72,
  },
});
