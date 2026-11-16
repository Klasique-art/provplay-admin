"use client";
import Link from "next/link";
import {usePathname} from "next/navigation";
import {navGroups} from "@/config/admin-pages";
import styles from "./admin.module.css";
export function Sidebar(){const pathname=usePathname();return <aside className={styles.sidebar}><Link className={styles.brand} href="/" aria-label="ProvPlay Control home"><span className={styles.brandMark}>P</span><span><strong>ProvPlay</strong><small>CONTROL</small></span></Link><nav className={styles.nav} aria-label="Administration">{navGroups.map(group=><section className={styles.navGroup} key={group.label}><h2>{group.label}</h2>{group.items.map(item=>{const active=pathname===item.href;return <Link className={active?styles.navActive:styles.navLink} href={item.href} key={item.href} aria-current={active?"page":undefined}><span>{item.short}</span>{item.label}</Link>})}</section>)}</nav><div className={styles.environment}><span></span><div><strong>Production</strong><small>All systems operational</small></div></div></aside>}
