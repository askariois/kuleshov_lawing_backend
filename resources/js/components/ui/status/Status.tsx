import React from "react";


interface IStatus {
  status: string;
  style?: string;
}

function Status({ status, style }: IStatus) {
  const getStatusStyle = (status: string) => {
    switch (status) {
      case "raw":
        return <><div className="text-[#E45454]">Необработанное</div></>;
      case "design":
        return <><div className="text-[#0AA947]">Обработано</div>
          <div className="text-[10px] text-[#7C7C7C] font-medium">Элемент дизайна</div></>;
      case "author":
        return <><div className="text-[#0AA947]">Обработано</div>
          <div className="text-[10px] text-[#7C7C7C] font-medium">Авторское</div></>;
      case "replaced":
        return <><div className="text-[#0AA947]">Обработано</div>
          <div className="text-[10px] text-[#7C7C7C] font-medium">Заменено</div></>;
      case "clent":
        return <><div className="text-[#F59106]">Запрос клиенту</div></>;
      case "free":
        return <><div className="text-[#3E95FB]">Бесплатное</div></>;
      case "process":
        return <><div className="text-[#F59106]">Вторичное</div>
          <div className="text-[10px] text-[#7C7C7C] font-medium"> Первичное (ОК)</div>
        </>;
      case "ToR":
        return <><div className="text-[#F59106]">В ТЗ</div></>;
      case "queue":
        return <><div className="text-[#3E95FB]">Очередь на генерацию</div></>;
      default:
        return <><div className="text-[#E45454]">Необработанное</div></>;
    }
  };

  return (
    <div
      className={`${style ? style : "text-[13px]"
        }  font-bold text-[13px] text-right`}
    >
      {getStatusStyle(status)}
    </div>
  );
}

export default Status;
