import { getSession } from "next-auth/react";
import Head from "next/head";
import React, { useEffect, useState } from "react";
import Layout from "~/components/Layout";
import type { NextApiRequest, NextApiResponse } from "next";
import superjson from "superjson";
import { createProxySSGHelpers } from "@trpc/react-query/ssg";
import { appRouter } from "~/server/api/root";
import { createTRPCContext } from "~/server/api/trpc";
import { api } from "~/utils/api";
import Filter from "~/components/Filter";
import Image from "next/image";
import InvoiceDisplay from "~/components/Invoice";
import Popup from "~/components/Popup";
import CreateInvoiceForm from "~/components/Form/InvoiceInsert";

export default function Invoice() {
  const { data: theme } = api.user.getPrefTheme.useQuery();
  const { data: invoicesData } = api.invoice.getInvoices.useQuery();
  const [isInsertOpen, setIsInsertOpen] = useState(false);

  useEffect(() => {
    if (theme?.darkMode) {
      document.getElementsByTagName("body")[0]?.classList.add("dark");
    }
  }, []);

  return (
    <>
      <Head>
        <title>Invoices</title>
        <meta name="description" content="Generated by create-t3-app" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <Layout isDarkMode={theme?.darkMode ?? false}>
        <>
          <Popup isOpen={isInsertOpen} setIsInsertOpen={setIsInsertOpen}>
            <CreateInvoiceForm setIsInsertOpen={setIsInsertOpen} />
          </Popup>

          <div className="mx-6 pt-8 md:mx-12 lg:pt-20">
            <div className="mx-auto flex max-w-screen-lg items-center justify-between ">
              <div>
                <h1 className="text-2xl font-bold leading-none dark:text-white md:text-4xl">
                  Invoices
                </h1>
                <span className="text-sm text-neutral-400 dark:text-neutral-800">
                  {invoicesData?.length ? (
                    invoicesData.length === 1 ? (
                      <span>1 Invoice</span>
                    ) : (
                      <span>{invoicesData.length} Invoices</span>
                    )
                  ) : (
                    "No invoices"
                  )}
                </span>
              </div>
              <div className="flex items-center gap-x-4 md:gap-x-11">
                <Filter />
                <button
                  className="flex items-center gap-x-2 rounded-3xl bg-primary-100 py-2 pl-2 pr-4 text-sm text-white"
                  onClick={() => setIsInsertOpen(true)}
                >
                  <span className="flex items-center justify-center rounded-full bg-white p-3">
                    <Image
                      src="/assets/icon-plus.svg"
                      width={10}
                      height={10}
                      alt="create new invoice"
                    />
                  </span>
                  <span>
                    New <span className="hidden md:inline">Invoice</span>
                  </span>
                </button>
              </div>
            </div>
            {!invoicesData?.length ? (
              <div className="mx-auto grid h-[calc(100vh-10.5rem)] max-w-screen-lg place-content-center overflow-y-auto overflow-x-hidden lg:h-[calc(100vh-9.5rem)]">
                <NoInvoices />
              </div>
            ) : (
              <div className="mx-auto mt-8 flex h-[calc(100vh-14rem)] max-w-screen-lg flex-col gap-4 overflow-y-auto overflow-x-hidden lg:h-[calc(100vh-11.5rem)]">
                {invoicesData.map((invoice) => {
                  return <InvoiceDisplay key={invoice.id} {...invoice} />;
                })}
              </div>
            )}
          </div>
        </>
      </Layout>
    </>
  );
}

export const getServerSideProps = async ({
  req,
  res,
}: {
  req: NextApiRequest;
  res: NextApiResponse;
}) => {
  const session = await getSession({ req });

  if (!session?.user) {
    return {
      redirect: {
        destination: "/",
        permanent: false,
      },
    };
  }

  const ssg = createProxySSGHelpers({
    router: appRouter,
    ctx: await createTRPCContext({
      req: req,
      res: res,
    }),
    transformer: superjson,
  });

  await ssg.user.getPrefTheme.prefetch();
  await ssg.invoice.getInvoices.prefetch();

  return {
    props: {
      trpcState: ssg.dehydrate(),
    },
  };
};

function NoInvoices() {
  return (
    <div className="w-56 text-center md:w-60">
      <div className="relative mx-auto h-40 w-52 md:h-48 md:w-56">
        <Image
          src={"/assets/illustration-empty.svg"}
          fill
          alt=""
          aria-hidden={true}
        />
      </div>
      <h2 className="mt-11 text-2xl font-bold text-neutral-500 dark:text-white">
        There is nothing here
      </h2>
      <p className="mt-5 text-sm text-neutral-400 dark:text-neutral-800">
        Create an invoice by clicking the <strong>New</strong> button and get
        started
      </p>
    </div>
  );
}
