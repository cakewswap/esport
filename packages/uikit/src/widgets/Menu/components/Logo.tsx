import React, { useContext } from "react";
import styled, { keyframes } from "styled-components";
import { useRouter } from "next/router";

interface Props {
  href: string;
}

const blink = keyframes`
  0%,  100% { transform: scaleY(1); }
  50% { transform:  scaleY(0.1); }
`;

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

const Logo: React.FC<React.PropsWithChildren<any>> = ({ isDark, text }) => {
  const textColor = isDark ? "#FFFFFF" : "#000000";
  const router = useRouter();

  return (
    <LogoText onClick={() => router.push("/")}>
      <Image src="/logo.png" />
      <span style={{ color: isDark ? "#FFFFFF" : "#000000" }}>{text || "GianniEsport"}</span>
    </LogoText>
  );
};

export default React.memo(Logo);
