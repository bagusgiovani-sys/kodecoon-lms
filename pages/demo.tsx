import type { GetServerSideProps } from 'next'
import { isMockMode } from '@/lib/mock/config'
import { MockApp } from '@/components/mock/MockApp'

export default function DemoPage(props: { path: string; sessionId?: string }) {
  return <MockApp {...props} />
}

export const getServerSideProps: GetServerSideProps = async ({ query }) => {
  if (!isMockMode()) return { notFound: true }
  return { props: {
    path: typeof query.path === 'string' ? query.path : '/login',
    ...(typeof query.sessionId === 'string' ? { sessionId: query.sessionId } : {}),
  } }
}
