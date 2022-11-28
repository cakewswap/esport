import React from "react";
import styled from "styled-components";
import { SvgProps } from "../types";

interface LogoProps extends SvgProps {
  isDark: boolean;
  text?: string;
}

const LogoText = styled.span`
  display: flex;
  align-items: center;

  span {
    display: none;
    font-weight: bold;
    font-size: 26px;
    margin-left: 20px;

    ${({ theme }) => theme.mediaQueries.sm} {
      display: block;
    }
  }
`;

const Image = styled.img`
  width: 50px;
`;

const Logo: React.FC<React.PropsWithChildren<LogoProps>> = ({ isDark, text, ...props }) => {
  const textColor = isDark ? "#FFFFFF" : "#000000";

  return (
    <LogoText>
      <Image src="/logo.png" />
      <span style={{ color: isDark ? "#FFFFFF" : "#000000" }}>{text || "GianniEsport"}</span>
    </LogoText>
  );
};

export default React.memo(Logo, (prev, next) => prev.isDark === next.isDark);
