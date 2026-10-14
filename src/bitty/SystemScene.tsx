import { Link } from 'react-router-dom';
import Mascot from './Mascot';
export function NotFoundScene(){return <div className="wide-page bitty-system-scene"><Mascot state="error_404" size={190}/><h1>Đường này chưa có bài học</h1><p>Mình kiểm tra lại địa chỉ, rồi quay về hành trình nhé.</p><Link className="btn primary" to="/">VỀ HÀNH TRÌNH</Link></div>;}
export function OfflineScene({message,onRetry}:{message:string;onRetry:()=>void}){return <div className="bitty-system-scene"><Mascot state="offline" size={150}/><h2>Bitty đang kiểm tra kết nối</h2><p>{message}</p><button className="btn primary" onClick={onRetry}>THỬ KẾT NỐI LẠI</button></div>;}
