export interface Scheme {
  sets: number
  repetitions: number
}

export interface SchemePerformance extends Scheme {
  weight: number
}

export interface Exercise<Id = string, SchemeType = Scheme[]> {
  _id: Id
  url?: string
  name: string
  schemes: SchemeType
}

export interface ExerciseGroup<
  Id = string,
  ExerciseType = Exercise,
  PerformanceType = ExercisePerformance,
> {
  _id: Id
  url?: string
  name: string
  objectives: ExerciseType[]
  performance?: PerformanceType[]
}

export type ExercisePerformance<
  Id = string,
  SchemeType = SchemePerformance[],
> = Exercise<Id, SchemeType>

export interface Session<
  ExerciseId = string,
  ExerciseType = Exercise,
  PerformanceType = ExercisePerformance,
> {
  day: number
  week: number
  exercises: ExerciseGroup<ExerciseId, ExerciseType, PerformanceType>[]
}

export interface Routine<
  Id = string,
  ExerciseId = string,
  ExerciseType = Exercise,
  PerformanceType = ExercisePerformance,
> {
  _id: Id
  sessions: Session<ExerciseId, ExerciseType, PerformanceType>[]
}

export interface Client<RoutineId = string, ExerciseId = string> {
  dni: string
  name: string
  routine: Routine<RoutineId, ExerciseId>
}
