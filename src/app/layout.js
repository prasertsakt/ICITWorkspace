import './globals.css';
import { AuthProvider } from '@/context/AuthContext';
import Navbar from '@/components/Navbar';
import MobileNav from '@/components/MobileNav';
import UnauthorizedModal from '@/components/UnauthorizedModal';

export const metadata = {
  title: 'ระบบบริหารจัดการองค์กร | ICIT Organization Hub',
  description: 'ระบบสารสนเทศบริหารจัดการองค์กร โครงสร้างบุคลากร ฝ่าย และฝ่ายบริหาร',
};

export default function RootLayout({ children }) {
  return (
    <html lang="th">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=0" />
      </head>
      <body>
        <AuthProvider>
          <div className="app-layout">
            <Navbar />
            <main>{children}</main>
            <MobileNav />
            <UnauthorizedModal />
          </div>
        </AuthProvider>
      </body>
    </html>
  );
}
