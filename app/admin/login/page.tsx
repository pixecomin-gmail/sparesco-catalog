// "use client";

// import { useState } from "react";
// import { useRouter } from "next/navigation";

// type LoginStep =
//   | "credentials"
//   | "otp";

// export default function AdminLoginPage() {
//   const router = useRouter();

//   const [step, setStep] =
//     useState<LoginStep>("credentials");

//   const [password, setPassword] =
//     useState("");

//   const [
//     securityCode,
//     setSecurityCode,
//   ] = useState("");

//   const [otp, setOtp] = useState("");

//   const [loading, setLoading] =
//     useState(false);

//   const [message, setMessage] =
//     useState("");

//   async function requestOtp(
//     e: React.FormEvent
//   ) {
//     e.preventDefault();

//     setLoading(true);
//     setMessage("");

//     try {
//       const response = await fetch(
//         "/api/admin/login",
//         {
//           method: "POST",
//           headers: {
//             "Content-Type":
//               "application/json",
//           },
//           body: JSON.stringify({
//             password,
//             securityCode,
//           }),
//         }
//       );

//       const data = await response.json();

//       if (!response.ok) {
//         alert(
//           data.error ||
//             "Unable to request OTP."
//         );
//         return;
//       }

//       setStep("otp");

//       setMessage(
//         data.message ||
//           "OTP sent to administrator email."
//       );
//     } catch (error) {
//       console.error(error);
//       alert("Unable to request OTP.");
//     } finally {
//       setLoading(false);
//     }
//   }

//   async function verifyOtp(
//     e: React.FormEvent
//   ) {
//     e.preventDefault();

//     setLoading(true);

//     try {
//       const response = await fetch(
//         "/api/admin/login/verify-otp",
//         {
//           method: "POST",
//           headers: {
//             "Content-Type":
//               "application/json",
//           },
//           body: JSON.stringify({
//             otp,
//           }),
//         }
//       );

//       const data = await response.json();

//       if (!response.ok) {
//         alert(
//           data.error ||
//             "Unable to verify OTP."
//         );
//         return;
//       }

//       router.push("/admin/vendors");
//       router.refresh();
//     } catch (error) {
//       console.error(error);
//       alert("Unable to verify OTP.");
//     } finally {
//       setLoading(false);
//     }
//   }

//   function requestAnotherOtp() {
//     setStep("credentials");
//     setOtp("");
//     setMessage("");
//   }

//   return (
//     <main style={pageStyle}>
//       <form
//         onSubmit={
//           step === "credentials"
//             ? requestOtp
//             : verifyOtp
//         }
//         style={formStyle}
//       >
//         <h1 style={titleStyle}>
//           Admin Login
//         </h1>

//         {step === "credentials" ? (
//           <>
//             <label
//               htmlFor="password"
//               style={labelStyle}
//             >
//               Password
//             </label>

//             <input
//               id="password"
//               type="password"
//               value={password}
//               onChange={(e) =>
//                 setPassword(
//                   e.target.value
//                 )
//               }
//               required
//               autoFocus
//               autoComplete="current-password"
//               style={inputStyle}
//             />

//             <label
//               htmlFor="securityCode"
//               style={labelStyle}
//             >
//               Security Code
//             </label>

//             <input
//               id="securityCode"
//               type="password"
//               value={securityCode}
//               onChange={(e) =>
//                 setSecurityCode(
//                   e.target.value
//                 )
//               }
//               required
//               autoComplete="off"
//               style={inputStyle}
//             />

//             <button
//               type="submit"
//               disabled={loading}
//               style={{
//                 ...primaryButtonStyle,
//                 opacity: loading
//                   ? 0.6
//                   : 1,
//               }}
//             >
//               {loading
//                 ? "Requesting OTP..."
//                 : "Request OTP"}
//             </button>
//           </>
//         ) : (
//           <>
//             {message && (
//               <div style={messageStyle}>
//                 {message}
//               </div>
//             )}

//             <label
//               htmlFor="otp"
//               style={labelStyle}
//             >
//               OTP
//             </label>

//             <input
//               id="otp"
//               type="text"
//               inputMode="numeric"
//               pattern="[0-9]{6}"
//               maxLength={6}
//               value={otp}
//               onChange={(e) =>
//                 setOtp(
//                   e.target.value
//                     .replace(/\D/g, "")
//                     .slice(0, 6)
//                 )
//               }
//               required
//               autoFocus
//               autoComplete="one-time-code"
//               placeholder="6-digit OTP"
//               style={{
//                 ...inputStyle,
//                 textAlign: "center",
//                 letterSpacing: "6px",
//                 fontSize: "20px",
//               }}
//             />

//             <button
//               type="submit"
//               disabled={
//                 loading ||
//                 otp.length !== 6
//               }
//               style={{
//                 ...primaryButtonStyle,
//                 opacity:
//                   loading ||
//                   otp.length !== 6
//                     ? 0.6
//                     : 1,
//               }}
//             >
//               {loading
//                 ? "Verifying..."
//                 : "Login"}
//             </button>

//             <button
//               type="button"
//               disabled={loading}
//               onClick={
//                 requestAnotherOtp
//               }
//               style={
//                 secondaryButtonStyle
//               }
//             >
//               Back / Request New OTP
//             </button>
//           </>
//         )}
//       </form>
//     </main>
//   );
// }

// const pageStyle: React.CSSProperties = {
//   minHeight: "100vh",
//   display: "flex",
//   alignItems: "center",
//   justifyContent: "center",
//   padding: "24px",
//   background: "#f7f5ef",
// };

// const formStyle: React.CSSProperties = {
//   width: "100%",
//   maxWidth: "420px",
//   border: "1px solid #dfe6e4",
//   borderRadius: "12px",
//   padding: "30px",
//   background: "#ffffff",
//   boxShadow:
//     "0 8px 28px rgba(23,63,76,0.08)",
// };

// const titleStyle: React.CSSProperties = {
//   margin: "0 0 24px",
//   color: "#173f4c",
//   fontSize: "28px",
// };

// const labelStyle: React.CSSProperties = {
//   display: "block",
//   marginBottom: "7px",
//   color: "#465b61",
//   fontSize: "12px",
//   fontWeight: 700,
// };

// const inputStyle: React.CSSProperties = {
//   width: "100%",
//   boxSizing: "border-box",
//   padding: "12px",
//   marginBottom: "16px",
//   border: "1px solid #d9e1df",
//   borderRadius: "7px",
//   background: "#ffffff",
//   color: "#173f4c",
//   outline: "none",
// };

// const primaryButtonStyle: React.CSSProperties = {
//   width: "100%",
//   padding: "12px",
//   border: "none",
//   borderRadius: "7px",
//   background: "#173f4c",
//   color: "#ffffff",
//   fontWeight: 700,
//   cursor: "pointer",
// };

// const secondaryButtonStyle: React.CSSProperties = {
//   width: "100%",
//   marginTop: "10px",
//   padding: "10px",
//   border: "none",
//   background: "transparent",
//   color: "#2a8392",
//   fontSize: "12px",
//   cursor: "pointer",
// };

// const messageStyle: React.CSSProperties = {
//   marginBottom: "18px",
//   padding: "10px 12px",
//   border: "1px solid #d3ebdf",
//   borderRadius: "7px",
//   background: "#eef8f3",
//   color: "#286647",
//   fontSize: "12px",
// };


// New file starts here
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function AdminLoginPage() {
  const router = useRouter();

  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  async function login(e: React.FormEvent) {
    e.preventDefault();

    setLoading(true);

    try {
      const response = await fetch(
        "/api/admin/login",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            password,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        alert(
          data.error ||
            "Unable to login."
        );
        return;
      }

      router.push("/admin");
      router.refresh();
    } catch (error) {
      console.error(error);
      alert("Unable to login.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main style={pageStyle}>
      <form
        onSubmit={login}
        style={formStyle}
      >
        <h1 style={titleStyle}>
          Admin Login
        </h1>

        <label
          htmlFor="password"
          style={labelStyle}
        >
          Password
        </label>

        <input
          id="password"
          type="password"
          value={password}
          onChange={(e) =>
            setPassword(e.target.value)
          }
          required
          autoFocus
          autoComplete="current-password"
          style={inputStyle}
        />

        <button
          type="submit"
          disabled={loading}
          style={{
            ...primaryButtonStyle,
            opacity: loading ? 0.6 : 1,
          }}
        >
          {loading
            ? "Logging in..."
            : "Login"}
        </button>
      </form>
    </main>
  );
}

const pageStyle: React.CSSProperties = {
  minHeight: "100vh",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  padding: "24px",
  background: "#f7f5ef",
};

const formStyle: React.CSSProperties = {
  width: "100%",
  maxWidth: "420px",
  border: "1px solid #dfe6e4",
  borderRadius: "12px",
  padding: "30px",
  background: "#ffffff",
  boxShadow:
    "0 8px 28px rgba(23,63,76,0.08)",
};

const titleStyle: React.CSSProperties = {
  margin: "0 0 24px",
  color: "#173f4c",
  fontSize: "28px",
};

const labelStyle: React.CSSProperties = {
  display: "block",
  marginBottom: "7px",
  color: "#465b61",
  fontSize: "12px",
  fontWeight: 700,
};

const inputStyle: React.CSSProperties = {
  width: "100%",
  boxSizing: "border-box",
  padding: "12px",
  marginBottom: "16px",
  border: "1px solid #d9e1df",
  borderRadius: "7px",
  background: "#ffffff",
  color: "#173f4c",
  outline: "none",
};

const primaryButtonStyle: React.CSSProperties = {
  width: "100%",
  padding: "12px",
  border: "none",
  borderRadius: "7px",
  background: "#173f4c",
  color: "#ffffff",
  fontWeight: 700,
  cursor: "pointer",
};