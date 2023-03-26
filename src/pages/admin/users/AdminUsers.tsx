import React, {useState} from 'react';
import Header from '../../../components/header/Header';
import styles from './adminUsers.module.css';
import {ACCESS_RIGHTS, StudentAccountStatus, User, UserTypes, UserTypesUa} from "../../../models/models";
import {usePopupWindow} from "../../../components/popupWindow/PopupWindowProvider";
import {useNotification} from "../../../components/notification/NotificationProvider";
import {useMutation, useQuery} from "@apollo/client";
import {GET_USERS} from "../../../api/operations/queries/users";
import {checkVerified, fullName, showNotification} from "../../../helpers/helpers";
import mainStyles from "../../../styles/main.module.css";
import Select from "react-select";
import {CategoryType, selectStyles} from "../../../styles/selectStyles";
import Add from "../../../components/icons/add/Add";
import Delete from "../../../components/icons/delete/Delete";
import DataList from "../../../components/dataList/DataList";
import BrowseUserPopupBody from "./browseUserPopupBody/BrowseUserPopupBody";
import Button from "../../../components/button/Button";
import {VERIFY_USER} from "../../../api/operations/mutations/verifyUser";
import {useLocal} from "../../../hooks/useLocal";
import EditUserPopupBody from "./editUserPopupBody/EditUserPopupBody";
import {client} from "../../../api/client";
import {DELETE_USER} from "../../../api/operations/mutations/deleteUser";
import VerifyButton from "./verifyButton/VerifyButton";
import HeaderCheckbox from "../../../components/headerCheckBox/HeaderCheckbox";
import Loader from "../../../components/loader/Loader";
import Edit from "../../../components/icons/edit/Edit";
import Back from "../../../components/icons/back/Back";

const categories: CategoryType[] = [
  {
    value: 'ALL',
    label: 'Всі',
  },
  {
    value: UserTypes.TEACHER,
    label: 'Викладачі'
  },
  {
    value: UserTypes.STUDENT,
    label: 'Студенти'
  },
  {
    value: UserTypes.POST_GRADUATE,
    label: 'Аситенти/Аспіранти'
  },
  {
    value: UserTypes.CONCERTMASTER,
    label: 'Концертмейстери'
  },
  {
    value: UserTypes.ILLUSTRATOR,
    label: 'Ілюстратори'
  }
];

const listHeader = ['ID', 'П.І.Б.', '', 'Статус']

const AdminUsers = () => {
  const {data, loading, error} = useQuery(GET_USERS);
  const dispatchPopupWindow = usePopupWindow();
  const dispatchNotification = useNotification();
  const [searchValue, setSearchValue] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('ALL');
  const [unverifiedOnly, setUnverifiedOnly] = useState(false);
  const [verifyUser] = useMutation(VERIFY_USER);
  const {data: {accessRights}} = useLocal('accessRights');
  const user = (user: User) => <>
    <span className={styles.alignText}>{user.id}</span>
    <span>{fullName(user)}</span>
    <span>{user.studentInfo?.accountStatus === StudentAccountStatus.UNVERIFIED && (
      <Button color='red'>Верифікувати</Button>
    )}
    </span>
    <span className={styles.alignText}>{UserTypesUa[user.type as UserTypes]}</span>
    <Edit dark onClick={() => handleCreate(user)}/>
    <Delete onClick={() => handleDelete(user.id)}/>
  </>;

  const handleErrorDetails = (e: any) => {
    dispatchPopupWindow({
      header: <h1>{e.name}</h1>,
      body: <>
        <p>{e.message}</p>
        <p>{e.extraInfo}</p>
        <pre>{e.stack}</pre>
      </>,
      footer: ''
    });
  };

  const handleDelete = async (userId: number) => {
    const confirmDelete = window.confirm('Ви дійсно бажаєте видалити всі дані про користувача?')
    if (confirmDelete) {
      try {
        const result = await client.mutate({
          mutation: DELETE_USER,
          variables: {
            where: {
              id: userId
            }
          }
        });
        dispatchNotification({
          header: "Успішно!",
          message: `Користувача видалено.`,
          type: "ok",
        });
      } catch (e: any) {
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
  };

  const handleCreate = (user?: User) => {
    dispatchPopupWindow({
      header: <h1>{user ? 'Редагувати акаунт користувача' : 'Створити новий акаунт співробітника'}</h1>,
      //@ts-ignore
      body: <EditUserPopupBody user={user} dispatchNotification={dispatchNotification}
                               dispatchPopupWindow={dispatchPopupWindow}/>,
      footer: null
    });
  };

  const handleSearch = (e: any) => {
    setSearchValue(e.target.value);
  };

  const handleSelectCategory = (e: any) => {
    setCategoryFilter(e.value);
  }

  const verify = async (userId: number) => {
    try {
      const result = await verifyUser({variables: {input: {userId}}});
      if (result.data.verifyUser.userErrors.length) {
        result.data.verifyUser.userErrors.forEach(({message}: any) => {
          showNotification(dispatchNotification, ['Помилка!', message, 'alert']);
        })
      } else {
        showNotification(dispatchNotification, ['Успішно!', 'Користувача верифіковано', 'ok']);
        try {
          await client.query({
            query: GET_USERS,
            fetchPolicy: 'network-only'
          })
        } catch (e: any) {
          showNotification(dispatchNotification, ['Помилка!', e.message.slice(0, 100), 'alert']);
        }
      }

    } catch (e: any) {
      showNotification(dispatchNotification, ['Помилка!', e.message.slice(0, 100), 'alert']);
    }
  };

  const handleItemClick = (id: number) => {
    const user = data.users?.find((item: User) => item.id === id);

    dispatchPopupWindow({
      header: <h1>{fullName(user)}</h1>,
      body: <BrowseUserPopupBody user={user}/>,
      footer: !checkVerified(user) && (
        <VerifyButton
          verify={() => verify(user.id)}
          dispatchPopupWindow={dispatchPopupWindow}
          dispatchNotification={dispatchNotification}
          userId={user.id}
        />
        )
    });
  };

  return (
    <div>
      <Header>
        <Back/>
        <h1>Управління користувачами</h1>
        <input
          type="text"
          value={searchValue}
          onChange={handleSearch}
          placeholder="Пошук за П.І.Б або ID"
          className={mainStyles.headerInput}
        />
        <Select
          options={categories}
          defaultValue={categories[0]}
          onChange={handleSelectCategory}
          styles={selectStyles}
        />
        <HeaderCheckbox
          label='Тільки неверифіковані'
          checked={unverifiedOnly}
          setChecked={() => setUnverifiedOnly(prevState => !prevState)}
        />
        <Add onClick={() => handleCreate()}/>
      </Header>
      {loading ? <Loader/> : data?.users.length ? (
        <DataList header={listHeader}
                  data={data.users
                    .filter((user: User) => (fullName(user).toLowerCase() + user.id).includes(searchValue.toLowerCase()))
                    .filter((user: User) => categoryFilter === 'ALL' ? true : user.type === categoryFilter)
                    .filter((user: User) => user.nameTemp === null)
                    .filter((user: User) => unverifiedOnly ? user.studentInfo?.accountStatus === StudentAccountStatus.UNVERIFIED : true)
                    .map((item: User) => user(item))}
                  handleItemClick={handleItemClick}
                  gridTemplateColumns='40px 1fr 100px 200px 40px 40px 40px'
        />
      ) : (
        <p>Користувачів не знайдено</p>
      )}
    </div>
  );
}

export default AdminUsers;
