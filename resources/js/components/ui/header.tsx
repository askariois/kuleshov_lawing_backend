import React, { Children } from "react";
import backIcon from "../../images/back.svg";
import { Link, router } from '@inertiajs/react';



interface IHeader {
  title: string;
  subtitle?: string;
  children?: any;
  back?: boolean;
}


function Header({ title, subtitle, children, back }: IHeader) {

  const goBack = () => {
    router.visit(window.history.state?.back || '/', { method: 'get' });
  };

  return (
    <div className="flex items-center justify-between mb-6 ">
      <div className="flex items-center space-x-4">
        {back && (
          <Link onClick={goBack}>
            <img src={backIcon} alt="Back" />
          </Link>
        )}
        <div>
          <h1 className="font-bold text-[22px] text-[#111111]">{title}</h1>
          {subtitle && (
            <p className="text-[13px] font-medium text-[#7C7C7C]">{subtitle}</p>
          )}
        </div>
      </div>
      <div>{children}</div>
    </div>
  );
}

export default Header;
