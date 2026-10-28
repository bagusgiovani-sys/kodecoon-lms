import { Document, Image, Page, Text, View, pdf } from '@react-pdf/renderer'
import { gradeDescriptions } from './studentDocuments'

export async function generateFeedbackPdf(input: { name: string; module: string; cycle: number; date: string; text: string; grades: Record<string, string> }) {
  return pdf(<Document title={`${input.name} - Learning feedback ${input.cycle}`}><Page size="A4" style={{ padding: 40, fontFamily: 'Helvetica', fontSize: 11, color: '#17243b', lineHeight: 1.5 }}>
    {/* React-PDF Image has its own accessibility API. */}
    {/* eslint-disable-next-line jsx-a11y/alt-text */}
    <Image src={`${window.location.origin}/brand/kodecoon.jpg`} style={{ width: 80, height: 80 }} />
    <Text style={{ fontSize: 23, marginTop: 12 }}>Learning progress feedback</Text>
    <Text style={{ fontSize: 16, marginVertical: 10 }}>{input.name}</Text>
    <Text>Module(s): {input.module}</Text><Text>Date: {input.date}</Text>
    <Text>Feedback {input.cycle} · Attended classes {(input.cycle - 1) * 12 + 1}–{input.cycle * 12}</Text>
    <Text style={{ marginTop: 10 }}>This report follows 12 attended classes, independently of module completion.</Text>
    <View style={{ marginVertical: 18 }}>{Object.entries(input.grades).map(([skill, grade]) => <View key={skill} style={{ flexDirection: 'row', justifyContent: 'space-between', padding: 8, borderBottomWidth: 1, borderBottomColor: '#d8e2f0' }}><Text>{skill}</Text><Text>{grade || 'Not assessed'}</Text></View>)}</View>
    <Text style={{ marginBottom: 20 }}>{input.text}</Text>
    <Text style={{ fontSize: 12, marginBottom: 5 }}>Understanding the grades</Text>
    {Object.entries(gradeDescriptions).map(([grade, description]) => <Text key={grade} style={{ fontSize: 9 }}>{grade}: {description}</Text>)}
    <Text style={{ marginTop: 10, fontSize: 9 }}>Grades describe current development and guide the next learning steps.</Text>
  </Page></Document>).toBlob()
}
