"use client";

import React from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import ArcCarousel from "./ArcCarousel";

interface FeedbackCard {
  id: string | number;
  title: string;
  image: string;
  slug: string;
}

const FEEDBACK_CARDS: FeedbackCard[] = [
  {
    id: 1,
    title: "Thiệp nhà gái",
    image:
      "https://cdn-resource.zenlove.me/uploads/67a8c867-a9f3-426d-9e22-8907ba71d53e/Z2lhbmczMTYxXzE3OTA5NTM5NDEzMjhfNXFrODIwc3NhbHE.jpg?crop=0,182,1216,912&format=webp&quality=80",
    slug: "67a8c867-a9f3-426d-9e22-8907ba71d53e",
  },
  {
    id: 2,
    title: "Thiệp cưới Tuấn Khang - Ngọc Hanh",
    image:
      "https://cdn-resource.zenlove.me/uploads/790cf114-1ab1-4efd-bfcc-943b387217ec/SEFOMDQ5NjNfMTc5MDMwODUwMzgzM183ZXhlOTZwcXN3Yw.jpg?crop=152,332,972,648&format=webp&quality=80",
    slug: "19BBNO1CSERC",
  },
  {
    id: 3,
    title: "Có cỗ rồii",
    image:
      "https://cdn-resource.zenlove.me/uploads/8d1ae053-0ae7-4a63-a59a-99c42960eacd/RFNDMDYwNjctY29weV8xNzkwNTIxODM0NzIyX2FxcWZhMTdvMHNk.jpg?crop=0,507,1216,811&format=webp&quality=80",
    slug: "OECKORQY1T08",
  },
  {
    id: 4,
    title: "Thiệp cưới Tuấn Giang",
    image:
      "https://cdn-resource.zenlove.me/uploads/5f447917-ef0e-4561-9feb-05ecda683a69/QUhBODQ0M18xNzg5OTAwMDM4MDQyX3BhdnF2cjZwZDhk.jpg?crop=117,407,973,649&format=webp&quality=80",
    slug: "5f447917-ef0e-4561-9feb-05ecda683a69",
  },
  {
    id: 5,
    title: "Xu Tee Wedding",
    image:
      "https://cdn-resource.zenlove.me/uploads/70fdce77-f6be-42b0-ab18-11f62d82c5e0/REJGQzMyN0QtQUU4Ny00RjVDLTgwNTAtODA3Q0Q3NjgxNjI3LTRfMTc4ODAwNjI4OTM4MV8wNThyMHltdTA3Mzk.png?crop=0,130,1483,1112&format=webp&quality=80",
    slug: "POOQ1NL248RZ",
  },
  {
    id: 6,
    title: "Thiệp cưới Nhật Tân & Đình Đình",
    image:
      "https://cdn-resource.zenlove.me/uploads/9834963e-b781-40b1-816d-0b09047e22d3/UFVNLTk5XzE3OTAyNTkxMDA0MDNfbjhuNG96dDlvZg.jpg?crop=11,614,1100,733&format=webp&quality=80",
    slug: "3MUIAS1DVQ9G",
  },
  {
    id: 7,
    title: "Thiệp Cưới Ngọc Thanh & Ngọc Mai",
    image:
      "https://cdn-resource.zenlove.me/uploads/acc08886-ba58-40c2-a2c8-a8a74a4b9cc6/MTBfMTc4OTI5MzA2MTk1NF9xZ2tuaHk5NTdz.jpg?crop=105,312,1197,798&format=webp&quality=80",
    slug: "MY6QQCCI29I5",
  },
  {
    id: 8,
    title: "Đám Cưới Diệu Lan & Mạnh Hùng",
    image:
      "https://cdn-resource.zenlove.me/uploads/3e1c5d4e-82cf-4187-9f06-7d52b7b2abe2/dieu-lan-and-manh-hung/MmFvYm9yMTA4Ynd1bXNydGkxenpyY3hhbXZ3bWdxY3pza2tkbWx1dzE1XzE3OTAyOTkxNDk4Njdfa2dra3oxMjI3anE.jpg?crop=0,500,1215,810&format=webp&quality=80",
    slug: "KGGHBT6CO8E0",
  },
  {
    id: 9,
    title: "WEDDING Ngô Hưởng & Ánh Nguyệt",
    image:
      "https://cdn-resource.zenlove.me/uploads/ce8148c5-1240-461b-beb6-5b4937652140/Tlo5MzAzMV8xNzg5MzgxNDMwMzk0X2J2ZHNqc2liYnI4.jpg?crop=0,455,1214,809&format=webp&quality=80",
    slug: "YNLXT5433UNY",
  },
  {
    id: 10,
    title: "Wedding of Thanh Bình - Phương Hồng",
    image:
      "https://cdn-resource.zenlove.me/uploads/f75855f4-cd0c-4a6d-ab68-8eb43d8e0a42/Mjg5QTcxNTgtMV8xNzg5MzE2MjkyNDU0X2p1emJpdmFocm9r.jpg?crop=140,243,1459,973&format=webp&quality=80",
    slug: "N83O7CY7T1B6",
  },
  {
    id: 11,
    title: "THIỆP MỜI ĐÁM CƯỚI Nguyễn Thìn - Bích Tiền",
    image:
      "https://cdn-resource.zenlove.me/uploads/862861ad-96f7-4738-b17f-56ad4f5c1e28/QkFhLVRoQW4tVGlhbl8xNzg5OTE0NzgyOTM4X3hodWtzYWpiZzE.jpg?crop=0,0,1920,1080&format=webp&quality=80",
    slug: "R9L69094M4CS",
  },
  {
    id: 12,
    title: "Thiệp cưới Xuân Huy & Hải Yến",
    image:
      "https://cdn-resource.zenlove.me/uploads/05099b1e-4c65-47ee-96ae-019b3b3da51b/V0FHTzE0ODFfMTc5MDgyMzgzOTQ3M19uOGE2eHkweDM5.jpg?crop=81,425,997,748&format=webp&quality=80",
    slug: "JECX746K1K8C",
  },
  {
    id: 13,
    title: "THIEP-MOI-NAM-TRANG",
    image:
      "https://cdn-resource.zenlove.me/uploads/67af8c31-9598-46fb-96fc-054b76856cb5/M2FmM2M1ZThlNDIzNDU2Ym1kXzE3OTA2NjY1NTgyMjZfYjJ6OXVkdDlsd2U.jpg?crop=0,350,1280,853&format=webp&quality=80",
    slug: "VHV3FTH19BTY",
  },
  {
    id: 14,
    title: "Đám Cưới Quốc Huy & Thanh Huyền",
    image:
      "https://cdn-resource.zenlove.me/uploads/3e1c5d4e-82cf-4187-9f06-7d52b7b2abe2/quoc-huy-and-thanh-huyen/MmFvYm9yMmhhcDlyZ3M2bHM3a24xdnI3cHBmOW14andzNDV3OWoydzRfMTc5MDc3ODUwMjIyN183a3duMnV0cTh3cw.jpg?crop=0,295,1281,854&format=webp&quality=80",
    slug: "KGGHBT6CO8E0",
  },
  {
    id: 15,
    title: "Thiệp Mời Hạnh Phúc",
    image:
      "https://cdn-resource.zenlove.me/uploads/b736dab3-3312-43e1-8267-01afcf7c8696/RFZMNDg5OTFfMTc5MDI3MDMwODU1Nl9jOThmNTYyZ3drZA.jpg?crop=11,290,973,649&format=webp&quality=80",
    slug: "8L0Q83U9U151",
  },
  {
    id: 16,
    title: "Wedding Thạnh Ngân",
    image:
      "https://cdn-resource.zenlove.me/uploads/5f63430b-9c93-492c-98b2-e879d9f9452d/M1Q0QTQyMDNfMTc4NzY0MjI4MzY4NF82M3ZpdmtoMjRiYw.jpg?crop=114,485,973,649&format=webp&quality=80",
    slug: "814Q9QW90Q86",
  },
  {
    id: 17,
    title: "Kim Ngân & Đình Toàn",
    image:
      "https://cdn-resource.zenlove.me/uploads/4581be4b-b9ac-43d1-b0ff-afc91d0e4080/SU1HNzA0MF8xNzkwMzUxMzU4OTY1X2N0NWt0ZXM0eDJh.jpg?crop=0,292,990,742&format=webp&quality=80",
    slug: "U06QWY9L8Q89",
  },
  {
    id: 18,
    title: "Đám Cưới Ngọc Sơn & Khánh Huyền",
    image:
      "https://cdn-resource.zenlove.me/uploads/3e1c5d4e-82cf-4187-9f06-7d52b7b2abe2/khanh-huyen-and-ngoc-son/Uk9aMDIwMzBfMTc4OTgyMzQ1MDI2MV9nZm95dWJoaGx0OA.jpg?crop=0,16,1799,1199&format=webp&quality=80",
    slug: "19BBNO1CSERC",
  },
  {
    id: 19,
    title: "Thư mời đám cưới Hiệp Quỳnh",
    image:
      "https://cdn-resource.zenlove.me/uploads/1e55c1fa-2f58-4089-9510-490ca1d678cb/VFQwODQ1MV8xNzkwMDUwNjgxOTUyX21zcWswN2xyY3ht.jpg?crop=185,15,1459,973&format=webp&quality=80",
    slug: "8L0U8L0Q90Q8",
  },
  {
    id: 20,
    title: "Ánh Nguyệt & Ngô Hưởng Wedding",
    image:
      "https://cdn-resource.zenlove.me/uploads/ce8148c5-1240-461b-beb6-5b4937652140/Tlo5Mjk2Ml8xNzg5NDY1NDMxMjAyX2J1dmhiZjAzZDI.jpg?crop=159,482,971,647&format=webp&quality=80",
    slug: "ce8148c5-1240-461b-beb6-5b4937652140",
  },
];

export default function FeedbackSection() {
  return (
    <section
      id="feedback"
      className="bg-[#fbfbfb] py-12"
      role="region"
      aria-labelledby="feedback-heading"
    >
      <div>
        <div className="max-w-7xl mx-auto text-center px-4 md:px-0">
          <div className="slide-up flex flex-col md:flex-row items-center justify-center mb-0 md:mb-4">
            <span
              className="text-6xl md:text-8xl font-semibold text-primary font-signature italic mr-0 md:mr-2 relative"
              aria-hidden="true"
            >
              999
              <span
                className="text-6xl md:text-6xl leading-none font-bold text-primary font-signature italic absolute -top-[2rem] -right-[2.6rem] md:-right-[3rem]"
                aria-hidden="true"
              >
                +
              </span>
            </span>
            <div className="md:text-left ml-0 mt-4 md:mt-0 md:ml-12">
              <h2
                id="feedback-heading"
                className="text-center md:text-left text-2xl md:text-3xl text-gray-900 uppercase font-heading font-bold"
              >
                CHIẾC THIỆP ONLINE
                <br />
                ĐÃ CHIA SẺ THÀNH CÔNG
              </h2>
            </div>
          </div>
          <p className="slide-up text-md md:text-base text-gray-600 max-w-2xl mx-auto mt-4 md:mt-0">
            Lời mời tham dự sự kiện bằng thiệp Online
            <br />
            phù hợp với mọi mạng xã hội và nền tảng trò chuyện trực tuyến
          </p>
          <h3 className="sr-only">
            Các thiệp mời đã được chia sẻ bởi người dùng
          </h3>
        </div>

        {/* Arc Carousel */}
        <div className="slide-up mx-auto mt-6 max-w-[1500px]">
          <ArcCarousel
            items={FEEDBACK_CARDS}
            label="Thiệp mời đã chia sẻ"
            cardWidth={210}
            visibleCards={7}
            caption={false}
            renderCard={(item) => (
              <Link
                href={`/show/${item.slug}`}
                title={`Xem thiệp cưới đã chia sẻ: ${item.title}`}
                className="group/arc-card block rounded-2xl"
              >
                <span
                  className="relative block overflow-hidden rounded-2xl border border-rose-100 bg-gray-100 shadow-[0_12px_28px_-14px_rgba(0,0,0,0.45)] [aspect-ratio:1000/1470]"
                  style={
                    {
                      "--image-scroll-percent": "0%",
                      "--scroll-duration": "0.6s",
                    } as React.CSSProperties
                  }
                >
                  <img
                    src={item.image}
                    alt={`Thiệp cưới online ${item.title}`}
                    loading="lazy"
                    decoding="async"
                    draggable={false}
                    className="h-auto w-full align-top [transform:translate3d(0,0,0)] transition-transform duration-200 ease-out"
                  />
                  <span
                    aria-hidden="true"
                    className="pointer-events-none absolute inset-0 bg-white/10 backdrop-blur-[3px] transition-[backdrop-filter,background-color] duration-300 group-hover/arc-card:bg-transparent group-hover/arc-card:backdrop-blur-0"
                  ></span>
                </span>
              </Link>
            )}
          />
        </div>

        {/* Action Button */}
        <div className="max-w-7xl mx-auto text-center px-4 md:px-0">
          <div className="slide-up flex justify-center mt-8">
            <Link
              className="bg-zen-primary hover:bg-[#d93849] text-white px-10 py-2.5 rounded-full font-medium shadow-md transition-all duration-300 hover:scale-105 hover:shadow-lg flex items-center gap-1.5"
              aria-label="Tạo thiệp online của bạn ngay"
              title="Tạo thiệp online của bạn ngay"
              href="/templates"
            >
              <span className="font-bold">Tạo thiệp của bạn ngay</span>
              <ArrowRight className="w-4 h-4 ml-0.5" />
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
