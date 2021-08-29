import React, {useEffect, useRef, useState} from "react";
import Header from "../../components/header/Header";
import {ACCESS_RIGHTS, ClassroomsFilterTypes, ClassroomType} from "../../models/models";
import Classroom from "../../components/classroom/Classroom";
import styles from "./classrooms.module.css";
import Caviar from "../../components/caviar/Caviar";
import {useNotification} from "../../components/notification/NotificationProvider";
import Edit from "../../components/icons/edit/Edit";
import HeaderSelect from "../../components/headerSelect/HeaderSelect";
import useClassrooms from "../../hooks/useClassrooms";
import {filterClassrooms} from "../../helpers/filterClassrooms";
import HeaderCheckbox from "../../components/headerCheckBox/HeaderCheckbox";
import Loader from "../../components/loader/Loader";
import {useLocal} from "../../hooks/useLocal";
import {FOLLOW_CLASSROOMS} from "../../api/operations/subscriptions/classrooms";
import {MINUTE} from "../../helpers/constants";
import {client} from "../../api/client";
import {GET_CLASSROOMS} from "../../api/operations/queries/classrooms";
import {GET_USERS} from "../../api/operations/queries/users";
import Button from "../../components/button/Button";

const filters = [
  {value: ClassroomsFilterTypes.ALL, label: 'Всі'},
  {value: ClassroomsFilterTypes.FREE, label: 'Вільні'},
  {value: ClassroomsFilterTypes.SPECIAL, label: 'Спеціалізовані'},
];

const Classrooms = () => {
  const [classrooms, subscribeToMore]: [ClassroomType[], any] = useClassrooms();
  const [filter, setFilter] = useState(filters[0].value);
  const [isNoWing, setIsNoWing] = useState(false);
  const [isOperaStudioOnly, setIsOperaStudioOnly] = useState(false);
  const [isAvailableForStudentOnly, setIsAvailableForStudentOnly] = useState(false);
  const dispatchNotification = useNotification();
  const {data: {accessRights}} = useLocal('accessRights');
  let timer = useRef(null);
  const [showResumePopup, setShowResumePopup] = useState(false);
  const getData = async () => {
    try {
      await client.query({
        query: GET_CLASSROOMS,
        fetchPolicy: 'network-only'
      });
      await client.query({
        query: GET_USERS,
        fetchPolicy: 'network-only'
      })
    } catch (e) {
      console.log(e);
    }
  };

  const handleResume = async () => {
    await getData();
    setShowResumePopup(false);
  };

  useEffect(() => {
    window.addEventListener('click', () => {
      clearTimeout(timer.current);
      timer.current = setTimeout(() => {
        setShowResumePopup(true);
      }, MINUTE * 15);
    });

    window.addEventListener('focus', () => {
      getData();
    });
    window.addEventListener('freeze', () => {
      setShowResumePopup(true);
    });
    window.addEventListener('resume', () => {
      getData();
    });
    const unsubscribeClassrooms = subscribeToMore({
      document: FOLLOW_CLASSROOMS,
    });
    return () => {
      unsubscribeClassrooms();
      window.removeEventListener('click', () => {
      });
      window.removeEventListener('focus', () => {
      });
      window.removeEventListener('resume', () => {
      });
      window.removeEventListener('freeze', () => {
      });
    }
  }, []);

  const handleFilterChange = (event: any) => {
    setFilter(event.value);
  };

  const handleToggleWing = () => {
    setIsNoWing(prevState => !prevState);
  };

  const handleToggleOperaStudio = () => {
    setIsOperaStudioOnly(prevState => !prevState);
  };

  const handleToggleAvailableForStudent = () => {
    setIsAvailableForStudentOnly(prevState => !prevState);
  };

  return (
    <div className={styles.classroomsPage}>
      {showResumePopup && <div className={styles.updateDataModal}>
          <div className={styles.popup}>
              <Button onClick={handleResume}>Продовжити роботу</Button>
          </div>
      </div>}
      <Header>
        <h1>Аудиторії</h1>
        <HeaderSelect options={filters} onChange={handleFilterChange}/>
        <HeaderCheckbox label='Без флігеля' checked={isNoWing} setChecked={handleToggleWing}/>
        <HeaderCheckbox label='Тільки оперна студія' checked={isOperaStudioOnly}
                        setChecked={handleToggleOperaStudio}
        />
        <HeaderCheckbox label='Доступні для видачі студенту' checked={isOperaStudioOnly}
                        setChecked={handleToggleAvailableForStudent}
        />
        {accessRights === ACCESS_RIGHTS.ADMIN && <Edit path='/adminClassrooms'/>}
      </Header>
      {!classrooms.length ? <Loader/> : (
        <>
          <Caviar dispatchNotification={dispatchNotification}
                  classrooms={filterClassrooms(classrooms, filter, isOperaStudioOnly, isNoWing,
                    isAvailableForStudentOnly)}
          />
          <ul className={styles.classroomsList}>
            {filterClassrooms(classrooms, filter, isOperaStudioOnly, isNoWing,
              isAvailableForStudentOnly)
              .map((classroom: ClassroomType) => (
                <Classroom
                  dispatchNotification={dispatchNotification}
                  key={classroom.id}
                  classroom={classroom}
                />
              ))}
          </ul>
        </>
      )}
    </div>
  );
};

export default Classrooms;