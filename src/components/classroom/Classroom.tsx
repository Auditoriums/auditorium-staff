import React, {useCallback, useEffect, useRef, useState} from "react";
import styles from "./classroom.module.css";
import {
  ClassroomType,
  DisabledState,
  OccupiedState,
  QueuePolicyTypes,
  ScheduleUnitType,
  User,
  UserTypes,
  UserTypesUa,
} from "../../models/models";
import {defineOccupyStatus, fullName, getBriefString, isClassroomNotFree, typeStyle} from "../../helpers/helpers";
import Instruments from "../instruments/Instruments";
import {usePopupWindow} from "../popupWindow/PopupWindowProvider";
import ClassroomInfo from "../ classroomInfo/ClassroomInfo";
import Tag from "../tag/Tag";
import Footer from "../footer/Footer";
import specialPiano from "../../assets/images/specialPiano.svg";
import moment from "moment";
import unlockIcon from "../../assets/images/unlock.svg";
import lockIcon from "../../assets/images/lock.svg";
import {client} from "../../api/client";
import {ENABLE_CLASSROOM} from "../../api/operations/mutations/enableClassroom";
import {DISABLE_CLASSROOM} from "../../api/operations/mutations/disableClassroom";
import {GET_SCHEDULE_UNIT} from "../../api/operations/queries/schedule";

interface PropTypes {
  classroom: ClassroomType;
  dispatchNotification: (value: any) => void;
  index: number;
}

const Classroom: React.FC<PropTypes> = ({classroom, dispatchNotification, index}) => {
  const {
    id, name, occupied, instruments, isWing, isOperaStudio, special, schedule, chair,
    isHidden, disabled, queueInfo: {queuePolicy: {policy, queueAllowedDepartments}}
  } = classroom;
  const occupiedUser = (occupied.state === OccupiedState.RESERVED
    || occupied.state === OccupiedState.PENDING) ? occupied.user : occupied.keyHolder
    ? occupied.keyHolder : occupied.user;
  const userFullName = fullName(occupiedUser as User, true);
  const dispatchPopupWindow = usePopupWindow();
  const [isOverdue, setIsOverDue] = useState(false);
  // const occupiedOnSchedule = isOccupiedOnSchedule(schedule);
  let timeout = useRef(null);
  const [scheduleUnits, setScheduleUnits] = useState<ScheduleUnitType[]>([]);

  const header = (
    <>
      <h1>{`Аудиторія ${name}${chair?.name ? ', ' + getBriefString(chair.name) : ''}`}</h1>
      {isWing && <Tag body="Флігель"/>}
      {isOperaStudio && <Tag body="Оперна студія"/>}
    </>
  );

  useEffect(() => {
    client.query({
      query: GET_SCHEDULE_UNIT,
      variables: {
        classroomName: classroom.name,
        date: moment().toISOString()
      }
    }).then(result => {
     setScheduleUnits(result.data.schedule);
    });
    return () => clearTimeout(timeout.current);
  }, []);

  useEffect(() => {
    if (classroom.occupied.state === OccupiedState.RESERVED) {
      const untilString: string = classroom.occupied.until as unknown as string;
      const diffInMs = moment(untilString).diff(moment());

      if (diffInMs >= 0 && !timeout.current) {
        timeout.current = setTimeout(() => setIsOverDue(true), diffInMs);
      } else if (diffInMs <= 0) {
        setIsOverDue(true);
      } else {
        setIsOverDue(false);
      }
    } else {
      setIsOverDue(false);
    }
    if (occupied.state !== OccupiedState.RESERVED && timeout.current) clearTimeout(timeout.current);
    defineStyle();
    defineStatus();
    defineStatusStiles();
  }, [classroom]);

  const defineStyle = () => {
    const occupiedStyle = {
      background: "#fff",
      transition: "all .3s cubic-bezier(0.25, 0.8, 0.25, 1)",
      border: isOverdue ? '4px solid red' : 'none'
    };
    const vacantStyle = {
      background: "#76e286",
      transition: "all .3s cubic-bezier(0.25, 0.8, 0.25, 1)",
    };
    const disableStyle = {
      background: "#b1b1b1",
      transition: "all .3s cubic-bezier(0.25, 0.8, 0.25, 1)",
      border: isOverdue ? '4px solid red' : 'none'
    };

    if (disabled?.state === DisabledState.DISABLED
      || (classroom.queueInfo.queuePolicy.policy === QueuePolicyTypes.SELECTED_DEPARTMENTS
        && !classroom.queueInfo.queuePolicy.queueAllowedDepartments.length)) return disableStyle;
    if (isClassroomNotFree(occupied)) return occupiedStyle;
    return vacantStyle;
  };

  const defineStatusStiles = () => {
    if (isOverdue) return styles.overdue;
    if (!isOverdue && occupied.state === OccupiedState.RESERVED) return styles.reserved;
    else return ''
  };

  const defineStatus = useCallback(() => defineOccupyStatus(classroom, scheduleUnits, isOverdue), [scheduleUnits, classroom, isOverdue]);

  const handleClick = () => {
    dispatchPopupWindow({
      header,
      //@ts-ignore
      body: <ClassroomInfo
        classroom={classroom}
        dispatchNotification={dispatchNotification}
        dispatchPopupWindow={dispatchPopupWindow}
      />,
      footer: <Footer
        classroomName={name}
        classroomId={id}
        disabled={disabled}
        occupied={occupied}
        dispatchNotification={dispatchNotification}
        dispatchPopupWindow={dispatchPopupWindow}
        isOverdue={isOverdue}
      />,
    });
  };

  const toggleDisable = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (disabled?.state === DisabledState.DISABLED) {
      try {
        await client.mutate({
          mutation: ENABLE_CLASSROOM,
          variables: {
            input: {
              classroomName: String(name)
            }
          }
        })
      } catch (e) {
        console.log(e)
      }
    } else {
      try {
        await client.mutate({
          mutation: DISABLE_CLASSROOM,
          variables: {
            input: {
              classroomName: String(name),
              until: moment().set('hours', 23).set('minutes', 59).toISOString(),
              comment: 'За розкладом'
            }
          }
        })
      } catch (e) {

      }
    }
  }

  return (
    <>
      <li
        key={id}
        className={styles.classroomsListItem}
        style={{
          ...defineStyle(),
          opacity: isHidden ? .5 : 1,
          border: classroom.disabled.warning ? '5px solid #f91354' : 'none'
        }}
        onClick={handleClick}
        tabIndex={index}
      >
        <div className={styles.header}>
          {special === 'PIANO' && (
            <img className={styles.special} src={specialPiano} alt="Special Piano"/>
          )}
          {!isHidden && (
            <img
              src={disabled?.state === DisabledState.DISABLED ? lockIcon : unlockIcon}
              alt={disabled?.state === DisabledState.DISABLED ? 'Разблокувати' : 'Заблокувати'}
              className={disabled?.state === DisabledState.DISABLED ? styles.lockIcon : styles.unlockIcon}
              title={disabled?.state === DisabledState.DISABLED ? 'Разблокувати' : 'Заблокувати за до кінця дня'}
              onClick={toggleDisable}
            />
          )}
          <h1 className={(policy === QueuePolicyTypes.SELECTED_DEPARTMENTS &&
            queueAllowedDepartments.length) ? styles.isDepartment : ''}>{name}</h1>
          {isClassroomNotFree(occupied) && (
            <div className={styles.occupantInfo}>
              <p className={styles.occupantName} title={userFullName}>{userFullName}</p>
              <p style={typeStyle(occupiedUser as User)} className={styles.occupantType}>
                {UserTypesUa[occupiedUser?.type as UserTypes]}
              </p>
            </div>
          )}
        </div>
        <div className={styles.occupationInfo}>
          <p className={defineStatusStiles()}
          >
            {defineStatus()}
          </p>
        </div>
        <Instruments instruments={instruments}/>
      </li>
    </>
  );
};

export default Classroom;
