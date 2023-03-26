import React, {useState} from "react";
import styles from "./registry.module.css";
import mainStyles from "../../styles/main.module.css";
import Header from "../../components/header/Header";
import {useQuery} from "@apollo/client";
import {GET_REGISTER} from "../../api/operations/queries/register";
import {RegisterUnit} from "../../models/models";
import pdfMake from "pdfmake/build/pdfmake";
import vfsFonts from "pdfmake/build/vfs_fonts";
import Button from "../../components/button/Button";
import {getDocumentDefinition, getFormattedData} from "./PDFConfig";
import {fullName, getTimeHHMM} from "../../helpers/helpers";
import UserProfile from "../../components/userProfile/UserProfile";
import {usePopupWindow} from "../../components/popupWindow/PopupWindowProvider";
import moment from "moment";

const Registry = () => {
  const dispatchPopupWindow = usePopupWindow();
  const [date, setDate] = useState(moment().format('YYYY-MM-DD'));
  const {data, loading, error} = useQuery(GET_REGISTER, {
    variables: {
      where: {
        AND: [{
          start: {
            gte: new Date(new Date(date).setHours(0, 0, 0, 0)).toISOString()
          },
        }, {
          start: {
            lte: new Date(new Date(date).setHours(23, 59, 59, 0)).toISOString()
          }
        }],
      }
    },
    fetchPolicy: "network-only"
  });
  const {vfs} = vfsFonts.pdfMake;
  pdfMake.vfs = vfs;
  const registerData = !loading && !error ? getFormattedData(data) : [];
  const registerDate = new Date(date);
  const documentDefinition = getDocumentDefinition(registerDate, registerData);
  const readableDate = new Date(date).getDate() + "."
    + (new Date(date).getMonth() + 1) + "."
    + new Date(date).getFullYear();

  const handleClick = (unit: RegisterUnit) => {
    if (unit.nameTemp === null) {
      dispatchPopupWindow({
        header: <h1>{fullName(unit.user)}</h1>,
        body: <UserProfile userId={unit.user.id as number}/>,
      });
    }
  };

  const handleChangeDate = (e: any) => {
    if (e.target.value) {
      setDate(e.target.value);
    }
  };

  return (
    <div>
      <Header>
        <h1>Журнал</h1>
        <input
          type="date"
          value={date}
          onChange={handleChangeDate}
          className={mainStyles.headerDateInput}
        />
        <div className={styles.buttons}>
          <Button
            onClick={() => {
              pdfMake.createPdf(documentDefinition).print();
            }}
          >
            Роздрукувати
          </Button>
          <Button
            onClick={() => {
              pdfMake
                .createPdf(documentDefinition)
                .download(
                  `register_${[
                    registerDate.getDate(),
                    registerDate.getMonth() + 1,
                    registerDate.getFullYear(),
                  ].join(".")}.pdf`
                );
            }}
          >
            Зберегти в PDF
          </Button>
        </div>
      </Header>

      {!loading && !error ? <div className={styles.wrapper}>
        <div className={styles.listHeader}>
          <p>Ауд.</p>
          <p>П. І. Б.</p>
          <p>Від</p>
          <p>До</p>
        </div>
        <ul className={styles.container}>
          {data?.register?.length === 0 &&
          <p className={styles.noItemsText}>За {readableDate} у журналі відвідувань записи відсутні</p>}
          {data.register && data.register.slice()
            .sort((a: RegisterUnit, b: RegisterUnit) => moment(b.start).valueOf() - moment(a.start).valueOf())
            .map((unit: RegisterUnit) => {
            const userName = unit.nameTemp === null ? fullName(unit.user) : unit.nameTemp;

            return <li
              onClick={() => handleClick(unit)}
              key={unit.start + unit.classroom.name}
              className={styles.unit}
            >
              <span>{unit.classroom.name}</span>
              <span className={!unit.nameTemp ? styles.active : ''}>{userName}</span>
              <span>{getTimeHHMM(new Date(unit.start))}</span>
              <span>{unit.end !== null ? getTimeHHMM(new Date(unit.end)) : '-'}</span>
            </li>
          })}
        </ul>
      </div> : <div>Loading....</div>}
    </div>
  );
};

export default Registry;
