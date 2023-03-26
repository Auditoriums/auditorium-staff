import {bool} from "yup";

export enum ACCESS_RIGHTS {
  USER,
  DISPATCHER,
  ADMIN
}

export enum ErrorCodesUa {
  INVALID_PASSWORD = "Невірний пароль",
  USER_NOT_FOUND = "Користувача не знайдено",
}

export enum ErrorCodes {
  INVALID_PASSWORD = "INVALID_PASSWORD",
  USER_NOT_FOUND = "USER_NOT_FOUND",
}

export enum EmploymentTypes {
  FULL_TIME = 'FULL_TIME',
  PART_TIME = 'PART_TIME',
  HOURLY = 'HOURLY',
}

export enum EmploymentTypesUa {
  FULL_TIME = 'Штатний співробітник',
  PART_TIME = 'Часткова',
  HOURLY = 'Погодинна',
}

export enum UserTypes {
  STUDENT = "STUDENT",
  TEACHER = "TEACHER",
  POST_GRADUATE = "POST_GRADUATE",
  ADMIN = "ADMIN",
  DISPATCHER = "DISPATCHER",
  PIANO_TUNER = "PIANO_TUNER",
  STAFF = "STAFF",
  CONCERTMASTER = "CONCERTMASTER",
  ILLUSTRATOR = "ILLUSTRATOR",
  OTHER = "OTHER",
}

export enum UserTypesUa {
  STUDENT = "Студент",
  TEACHER = "Викладач",
  POST_GRADUATE = "Асистент/аспірант",
  ADMIN = "Адмін",
  DISPATCHER = "Диспетчер",
  PIANO_TUNER = "Настроювач фортепіано",
  STAFF = "Співробітник",
  CONCERTMASTER = "Концертмейстер",
  ILLUSTRATOR = "Ілюстратор",
  OTHER = "Користувач",
}

export enum UserTypeColors {
  STUDENT = "#1e2c4f",
  TEACHER = "#ffa200",
  POST_GRADUATE = "#1e2c4f",
  ADMIN = "#ffa200",
  DISPATCHER = "#ffa200",
  PIANO_TUNER = "#ffa200",
  STAFF = "#ffa200",
  CONCERTMASTER = "#ffa200",
  ILLUSTRATOR = "#ffa200",
  OTHER = "#ffa200",
}

export enum ActivityTypes {
  LECTURE = '#ffa200',
  INDIVIDUAL_LESSON = '#2b5dff'
}

export enum NotificationsTypes {
  OK = "ok",
  ALERT = "alert",
  DEFAULT = "default",
}

export type User = {
  id: number;
  createdAt: Date;
  firstName: string;
  patronymic: string | null;
  lastName: string;
  type: string;
  department: Department;
  email: string;
  phoneNumber: string;
  extraPhoneNumbers: string | null;
  nameTemp: string | null;
  startYear: number;
  studentInfo: StudentInfo;
  employeeInfo: EmployeeInfo;
  expireDate: Date | null;
  queue: QueueRecord[];
  queueInfo: UserQueueInfo;
  occupiedClassrooms: OccupiedInfo[];
};

export type StudentInfo = {
  degree: Degree;
  startYear: number;
  accountStatus: StudentAccountStatus;
};

export type EmployeeInfo = {
  employmentType: EmploymentTypes;
  accountStatus: string;
  isInUsage: boolean;
};

export type OccupiedInfo = {
  id: number;
  user: User | null;
  keyHolder: User | null;
  keyHolderId: number;
  until: string;
  state: OccupiedState;
  classroom: ClassroomType;
  classroomId: number;
};

export enum OccupiedState {
  FREE = 'FREE',
  OCCUPIED = 'OCCUPIED',
  PENDING = 'PENDING',
  RESERVED = 'RESERVED'
}

export enum OccupiedStateUa {
  FREE = 'Вільно',
  OCCUPIED = 'Зайнято',
  PENDING = 'Очікує підтвердження',
  RESERVED = 'Зарезервовано'
}

export type Comment = {
  id: number;
  user: User;
  body: string;
  date: Date;
};

export type InstrumentType = {
  id: number;
  type: string;
  name: string;
  rate: number;
  persNumber: string;
  comments: Comment | null;
  classroom: ClassroomType;
};

export enum DisabledState {
  DISABLED = 'DISABLED',
  NOT_DISABLED = 'NOT_DISABLED'
}

export type DisabledInfo = {
  state: DisabledState;
  comment: string;
  until: Date;
  warning: boolean;
};

export type ScheduleUnitType = {
  id: number;
  user: User;
  classroom: ClassroomType;
  dateStart: Date;
  dateEnd: Date;
  dayOfWeek: number;
  from: string;
  to: string;
  activity: ScheduleUnitActivityT;
  type: ScheduleUnitTypeT;
  primaryScheduleUnit: ScheduleUnitType;
};

export enum ScheduleUnitActivityT {
  INDIVIDUAL_LESSON = 'Індивідуальні заняття',
  LECTURE = 'Лекція'
}

export enum ScheduleUnitTypeT {
  PRIMARY = 'PRIMARY',
  SUBSTITUTION = 'SUBSTITUTION'
}

export type ClassroomType = {
  id: number;
  name: string;
  chair: Department | null;
  special: string | null;
  floor: number;
  isWing: boolean;
  isOperaStudio: boolean;
  description: string | null;
  occupied: OccupiedInfo;
  instruments: Array<InstrumentType>;
  disabled: DisabledInfo | null;
  schedule: Array<ScheduleUnitType>;
  isHidden: boolean;
  queueInfo: ClassroomQueueInfo;
  color: string;
};

export type ClassroomQueueInfo = {
  classroom: ClassroomType;
  queuePolicy: QueuePolicyInfo;
}

export type QueuePolicyInfo = {
  classroomQueueInfo: ClassroomQueueInfo;
  policy: QueuePolicyTypes;
  queueAllowedDepartments: ExclusivelyQueueAllowedDepartmentsInfo[];
}

export type ExclusivelyQueueAllowedDepartmentsInfo = {
  department: Department;
  queuePolicyInfo: QueuePolicyInfo;
}

export type RegisterUnit = {
  id: number;
  user: User;
  nameTemp: string;
  classroom: {
    id: number;
    name: string;
  };
  start: string;
  end: string;
};

export type Degree = {
  id: number
  name: string;
  startMonth: number;
  startDay: number;
  durationMonths: number;
};

export type Faculty = {
  id: number;
  name: string;
  departments: Department[];
  users: User[];
}

export type Department = {
  id: number;
  name: string;
  faculty: Faculty;
  users: User[];
};

export type MenuElement = {
  text: string;
  path: string;
  icon: string;
  exact?: boolean;
  rights: string;
};

export enum ClassroomsFilterTypes {
  ALL = 'ALL',
  FREE = 'FREE',
  SPECIAL = 'SPECIAL'
}

export enum QueueState {
  ACTIVE = 'ACTIVE',
  RESERVED = 'RESERVED'
}

export enum QueueType {
  MINIMAL = 'MINIMAL',
  DESIRED = 'DESIRED'
}

export type QueueRecord = {
  id: number;
  user: User;
  date: string;
  classroom: ClassroomType;
  state: QueueState;
  type: QueueType;
}

export type LangT = 'ua' | 'en';

export enum EnqueuedBy {
  SELF = 'SELF',
  DISPATCHER = 'DISPATCHER'
}

export type UserQueueInfo = {
  id: number;
  user: User;
  sanctionedUntil: string;
  currentSession: QueueSession
}

export type QueueSession = {
  id: number;
  queueInfo: UserQueueInfo;
  state: UserQueueState;
  enqueuedBy: EnqueuedBy;
  skips: number;
  remainingOccupationTime: string;
}

export enum UserQueueState {
  IN_QUEUE_MINIMAL = 'IN_QUEUE_MINIMAL',
  IN_QUEUE_DESIRED_AND_OCCUPYING = 'IN_QUEUE_DESIRED_AND_OCCUPYING',
  QUEUE_RESERVED_NOT_OCCUPYING = 'QUEUE_RESERVED_NOT_OCCUPYING',
  OCCUPYING = 'OCCUPYING',
}

export enum StudentAccountStatus {
  UNVERIFIED = 'UNVERIFIED',
  ACTIVE = 'ACTIVE',
  ACADEMIC_LEAVE = 'ACADEMIC_LEAVE'
}

export enum EmployeeAccountStatus {
  ACTIVE = 'ACTIVE',
  FROZEN = 'FROZEN'
}

export enum QueuePolicyTypes {
  ALL_DEPARTMENTS = 'ALL_DEPARTMENTS',
  SELECTED_DEPARTMENTS = 'SELECTED_DEPARTMENTS'
}

export enum SpecialClassroomTypes {
  PIANO = 'PIANO'
}

export enum InstrumentTypesE {
  UpRightPiano = 'UpRightPiano',
  GrandPiano = 'GrandPiano'
}

export enum InstrumentTypesEUa {
  UpRightPiano = 'Піаніно',
  GrandPiano = 'Рояль'
}

export type CrashModeT = {
  isActive: boolean;
  comment: string;
  until: Date | null;
  globalMessage?: string;
}
