import React, {useEffect, useState} from 'react';
import {
  Department,
  EmployeeAccountStatus,
  EmploymentTypes,
  EmploymentTypesUa,
  User,
  UserTypes,
  UserTypesUa
} from "../../../../models/models";
import styles from './../../classrooms/createClassroomPopupBody/createClassroomPopupBody.module.css';
import {client} from "../../../../api/client";
import {SIGNUP_EMPLOYEE} from "../../../../api/operations/mutations/signupEmployee";
import moment from "moment";
import Select from "react-select";
import {selectLightStyles} from "../../../../styles/selectStyles";
import Button from "../../../../components/button/Button";
import {useQuery} from "@apollo/client";
import {GET_DEPARTMENTS} from "../../../../api/operations/queries/departments";
import {GET_USERS} from "../../../../api/operations/queries/users";
import {ONLY_DIGITS} from "../../../../helpers/validators";
import removeIcon from "../../../../assets/images/delete.svg";
import {UPDATE_USER} from "../../../../api/operations/mutations/updateUser";

interface PropTypes {
  user: User;
}

const userTypesData = [
  {value: UserTypes.STAFF, label: UserTypesUa.STAFF},
  {value: UserTypes.ILLUSTRATOR, label: UserTypesUa.ILLUSTRATOR},
  {value: UserTypes.CONCERTMASTER, label: UserTypesUa.CONCERTMASTER},
  {value: UserTypes.TEACHER, label: UserTypesUa.TEACHER},
  {value: UserTypes.PIANO_TUNER, label: UserTypesUa.PIANO_TUNER},
  {value: UserTypes.OTHER, label: UserTypesUa.OTHER},
  {value: UserTypes.ADMIN, label: UserTypesUa.ADMIN},
  {value: UserTypes.DISPATCHER, label: UserTypesUa.DISPATCHER},
];

const studentsTypesData = [
  {value: UserTypes.POST_GRADUATE, label: UserTypesUa.POST_GRADUATE},
  {value: UserTypes.STUDENT, label: UserTypesUa.STUDENT},
]

const employmentTypesData = [
  {value: EmploymentTypes.FULL_TIME, label: EmploymentTypesUa.FULL_TIME},
  {value: EmploymentTypes.PART_TIME, label: EmploymentTypesUa.PART_TIME},
  {value: EmploymentTypes.HOURLY, label: EmploymentTypesUa.HOURLY},
];

const NO_PHONE_NUMBER = 'No phone number';

const isStudent = (user: User) => user && user?.type === UserTypes.STUDENT || user?.type === UserTypes.POST_GRADUATE;

const EditUserPopupBody: React.FC<PropTypes> = ({
                                                  user, dispatch, dispatchNotification,
                                                  dispatchPopupWindow
                                                }: any) => {
  const {data, loading, error} = useQuery(GET_DEPARTMENTS);
  const [departmentsData, setDepartmentsData] = useState([{value: -1, label: ''}]);
  const [selectedDepartment, setSelectedDepartment] = useState(departmentsData[0]);
  const [selectedUserType, setSelectedUserType] = useState(userTypesData[0]);
  const [firstName, setFirstName] = useState(user?.firstName || '');
  const [lastName, setLastName] = useState(user?.lastName || '');
  const [patronymic, setPatronymic] = useState(user?.patronymic || '');
  const [withDateLimit, setWithDateLimit] = useState(!user?.expireDate && !isStudent(user));
  const [expireDate, setExpireDate] = useState(user?.expireDate ? moment(user?.expireDate).format('yyyy-MM-DD') : '');
  const [selectedEmploymentType, setSelectedEmploymentType] = useState(employmentTypesData[0]);
  const [phoneNumber, setPhoneNumber] = useState(user?.phoneNumber !== NO_PHONE_NUMBER ? user?.phoneNumber : '+380');
  const [extraPhoneNumbers, setExtraPhoneNumbers] = useState<string[]>(user?.extraPhoneNumbers ? JSON.parse(user.extraPhoneNumbers) : []);

  useEffect(() => {
    if (user) {
      const currentStaffUserType = userTypesData.find(({value}) => value === user.type);
      const currentStudentUserType = studentsTypesData.find(({value}) => value === user.type);
      setSelectedUserType(currentStaffUserType || currentStudentUserType || userTypesData[0]);
    }
  }, [user]);

  useEffect(() => {
    if (!loading && !error) {
      const mappedDepartments = data.departments.map((department: Department) => {
        return ({value: department.id, label: department.name});
      });
      setDepartmentsData(mappedDepartments);

      if (user && user.department?.id) {
        const currentUserDepartment = mappedDepartments.find(({value}: any) => value === user.department.id);
        setSelectedDepartment(currentUserDepartment);
      } else {
        setSelectedDepartment(mappedDepartments[0]);
      }
      if (user && user.employeeInfo) {
        const currentUserEmploymentType = employmentTypesData.find(item => user.employeeInfo.employmentType === item.value);
        setSelectedEmploymentType(currentUserEmploymentType);
      }
    }
  }, [data]);

  const handleErrorDetails = (e: any) => {
    dispatchPopupWindow({
      header: <h1>{e.name}</h1>,
      body: (
        <div>
          <p>{e.message}</p>
          <p>{e.extraInfo}</p>
          <pre>{e.stack}</pre>
        </div>
      ),
      footer: ''
    });
  };

  const handleSignUpEmployee = async (e: any) => {
    e.preventDefault();
    try {
      const result = await client.mutate({
        mutation: SIGNUP_EMPLOYEE,
        variables: {
          input: {
            firstName,
            patronymic,
            lastName,
            type: selectedUserType.value,
            department: (
              selectedUserType.value === UserTypes.TEACHER
              || selectedUserType.value === UserTypes.CONCERTMASTER
              || selectedUserType.value === UserTypes.ILLUSTRATOR
            ) ? {
              connect: {
                id: selectedDepartment.value
              }
            } : undefined,
            employeeInfo: {
              create: {
                employmentType: selectedEmploymentType.value,
                accountStatus: EmployeeAccountStatus.ACTIVE
              }
            },
            expireDate: !withDateLimit ? moment(expireDate).toISOString() : undefined
          }
        }
      });
      if (result.data.signupEmployee.userErrors?.length) {
        result.data.signupEmployee.userErrors.forEach(({message}: any) => {
          dispatchNotification({
            header: "Помилка",
            message,
            type: "alert",
          });
        })
      } else {
        await client.query({
          query: GET_USERS,
          fetchPolicy: 'network-only'
        })
        dispatchNotification({
          header: "Успішно!",
          message: `Новий акаунт співробітника створено.`,
          type: "ok",
        });
        dispatch({
          type: "POP_POPUP_WINDOW",
        });
      }
    } catch (e) {
      console.log(e);
      dispatchNotification({
        header: "Помилка!",
        message: <><span>Щось пішло не так.</span><br/>
          <span style={{color: '#2b5dff', cursor: 'pointer', textDecoration: 'underline'}}
                onClick={() => handleErrorDetails && handleErrorDetails(e)}>Деталі</span></>,
        type: "alert",
      });
    }
  };

  const handleUpdateUser = async () => {
    try {
      await client.mutate({
        mutation: UPDATE_USER,
        variables: {
          data: {
            firstName: {set: firstName},
            lastName: {set: lastName},
            patronymic: {set: patronymic},
            type: {set: selectedUserType.value},
            phoneNumber: {set: phoneNumber},
            extraPhoneNumbers: JSON.stringify(extraPhoneNumbers),
            expireDate: {
              set: !withDateLimit ? moment(expireDate).toISOString() : null
            },
            department: (
              selectedUserType.value === UserTypes.TEACHER
              || selectedUserType.value === UserTypes.CONCERTMASTER
              || selectedUserType.value === UserTypes.ILLUSTRATOR || isStudent(user)
            ) ? {
              connect: {
                id: selectedDepartment.value
              }
            } : undefined,
            employeeInfo: isStudent(user) ? undefined : {
              update: {
                employmentType: {set: selectedEmploymentType.value},
                accountStatus: {set: EmployeeAccountStatus.ACTIVE},
              }
            },
          },
          where: {
            id: user.id
          }
        }
      })
      await client.query({
        query: GET_USERS,
        fetchPolicy: 'network-only'
      })
      dispatchNotification({
        header: "Успішно!",
        message: `Дані користувача змінено.`,
        type: "ok",
      });
      dispatch({
        type: "POP_POPUP_WINDOW",
      });
    } catch (e) {
      console.log(e);
      dispatchNotification({
        header: "Помилка!",
        message: <><span>Щось пішло не так.</span><br/>
          <span style={{color: '#2b5dff', cursor: 'pointer', textDecoration: 'underline'}}
                onClick={() => handleErrorDetails && handleErrorDetails(e)}>Деталі</span></>,
        type: "alert",
      });
    }
  }

  const addExtraPhoneNumber = () => {
    setExtraPhoneNumbers(prev => [...prev, '+380']);
  };

  const editExtraNumber = (value: string, index: number) => {
    setExtraPhoneNumbers(prev => {
      const valid = ONLY_DIGITS.test(value);
      const newNum = valid ? value.trim() : prev[index];
      const newArr = prev.slice();
      newArr.splice(index, 1, newNum);
      return newArr;
    });
  };

  const removeExtraPhoneNumber = (index: number) => {
    setExtraPhoneNumbers(prev => {
      const newArr = prev.slice();
      newArr.splice(index, 1);
      return newArr;
    });
  };

  return (
    <div>
      <div className={styles.wrapper}>
        <form className={styles.container}>
          <label>Прізвище
            <input
              value={lastName}
              placeholder="Прізвище"
              onChange={(e) => setLastName(e.target.value)}
            />
          </label>
          <label>Ім'я
            <input
              value={firstName}
              placeholder="Ім'я"
              onChange={(e) => setFirstName(e.target.value)}
            />
          </label>
          <label>По-батькові
            <input
              value={patronymic}
              placeholder="По-батькові"
              onChange={(e) => setPatronymic(e.target.value)}
            />
          </label>
          <label>Тип акаунту
            <Select
              value={selectedUserType}
              onChange={e => setSelectedUserType(e)}
              options={isStudent(user) ? studentsTypesData : userTypesData}
              //@ts-ignore
              styles={selectLightStyles}
              menuPortalTarget={document.body}
              isSearchable
              placeholder='Виберіть тип'
            />
          </label>
          {!isStudent(user) && (
            <>
              <label>Тип занятості
                <Select
                  value={selectedEmploymentType}
                  onChange={e => setSelectedEmploymentType(e)}
                  options={employmentTypesData}
                  //@ts-ignore
                  styles={selectLightStyles}
                  menuPortalTarget={document.body}
                  isSearchable
                  placeholder='Виберіть тип зайнятість'
                />
              </label>
              <label>Безстроковий термін дії
                <input type="checkbox" checked={withDateLimit}
                       onChange={() => setWithDateLimit(prevState => !prevState)}
                />
              </label>
            </>
          )}
          {!withDateLimit && (
            <label>Термін дії
              <input type="date"
                     value={expireDate}
                     onChange={e => setExpireDate(e.target.value)}
              />
            </label>
          )}
          {(selectedUserType.value === UserTypes.TEACHER
            || selectedUserType.value === UserTypes.CONCERTMASTER
            || selectedUserType.value === UserTypes.ILLUSTRATOR || isStudent(user)
          ) && (
            <label>Кафедра
              <Select
                value={selectedDepartment}
                onChange={e => setSelectedDepartment(e)}
                options={departmentsData}
                //@ts-ignore
                styles={selectLightStyles}
                menuPortalTarget={document.body}
                isSearchable
                placeholder='Виберіть кафедру'
              />
            </label>
          )}
          {user && (
            <label>Телефон
              <input type="phone"
                     value={phoneNumber}
                     onChange={e => setPhoneNumber(e.target.value)}
              />
            </label>
          )}
          {user && extraPhoneNumbers.map((number: string, index: number) => (
            <label className={styles.extraPhoneWrapper} key={index}>Додатковий телефон {index + 1}
              <input type="phone"
                     value={extraPhoneNumbers[index]}
                     onChange={e => editExtraNumber(e.target.value, index)}
              />
              <img src={removeIcon} alt="remove" onClick={() => removeExtraPhoneNumber(index)}/>
            </label>
          ))}
          {user && (
            <Button
              onClick={addExtraPhoneNumber}
              style={{width: 130, height: 30, alignSelf: 'flex-end'}}
            >
              Додати телефон
            </Button>
          )}
          {user ? (
            <Button onClick={handleUpdateUser} style={{marginTop: 16, height: 40}}
                    disabled={!firstName || !lastName}>
              Зберегти зміни
            </Button>
          ) : (
            <Button onClick={handleSignUpEmployee} style={{marginTop: 16, height: 40}}
                    disabled={!firstName || !lastName}>
              Створити новий акаунт
            </Button>
          )}
        </form>
      </div>
    </div>
  );
}

export default EditUserPopupBody;
