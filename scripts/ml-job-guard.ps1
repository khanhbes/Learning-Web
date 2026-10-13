# Owns the whole Chromium process tree. Closing stdin closes the job handle,
# which kills every process; a learner cannot escape through a child process.
$ErrorActionPreference = 'Stop'
Add-Type -TypeDefinition @'
using System;
using System.Text;
using System.Runtime.InteropServices;
public static class BytePathJob {
 [StructLayout(LayoutKind.Sequential)] public struct IO_COUNTERS { public ulong a,b,c,d,e,f; }
 [StructLayout(LayoutKind.Sequential)] public struct BASIC_LIMIT { public long a,b; public uint Flags; public UIntPtr Min,Max; public uint Active; public UIntPtr Affinity; public uint Priority,Scheduling; }
 [StructLayout(LayoutKind.Sequential)] public struct EXTENDED_LIMIT { public BASIC_LIMIT Basic; public IO_COUNTERS IO; public UIntPtr ProcessMemory,JobMemory,PeakProcess,PeakJob; }
 [StructLayout(LayoutKind.Sequential,CharSet=CharSet.Unicode)] public struct STARTUPINFO { public uint cb; public string reserved,desktop,title; public uint x,y,xs,ys,xc,yc,fill,flags; public ushort show,reserved2; public IntPtr bytes,input,output,error; }
 [StructLayout(LayoutKind.Sequential)] public struct PROCESS_INFORMATION { public IntPtr process,thread; public uint pid,tid; }
 [DllImport("kernel32.dll",CharSet=CharSet.Unicode,SetLastError=true)] static extern IntPtr CreateJobObject(IntPtr a,string name);
 [DllImport("kernel32.dll",SetLastError=true)] static extern bool SetInformationJobObject(IntPtr job,int type,ref EXTENDED_LIMIT value,uint length);
 [DllImport("kernel32.dll",SetLastError=true)] static extern bool AssignProcessToJobObject(IntPtr job,IntPtr process);
 [DllImport("kernel32.dll",SetLastError=true)] static extern bool TerminateJobObject(IntPtr job,uint code);
 [DllImport("kernel32.dll",SetLastError=true)] static extern bool TerminateProcess(IntPtr process,uint code);
 [DllImport("kernel32.dll",CharSet=CharSet.Unicode,SetLastError=true)] static extern bool CreateProcess(string app,StringBuilder command,IntPtr pa,IntPtr ta,bool inherit,uint flags,IntPtr env,string cwd,ref STARTUPINFO start,out PROCESS_INFORMATION info);
 [DllImport("kernel32.dll",SetLastError=true)] static extern uint ResumeThread(IntPtr thread);
 [DllImport("kernel32.dll",SetLastError=true)] static extern bool CloseHandle(IntPtr handle);
 static IntPtr job;
 static string Quote(string s) { var b=new StringBuilder("\""); int slashes=0; foreach(char c in s) { if(c=='\\') {slashes++;continue;} if(c=='\"') b.Append('\\',slashes*2+1); else b.Append('\\',slashes); slashes=0;b.Append(c); } b.Append('\\',slashes*2);b.Append('"');return b.ToString(); }
 static void Check(bool ok) {if(!ok) throw new System.ComponentModel.Win32Exception(Marshal.GetLastWin32Error());}
 public static uint Start(string executable,string[] args,string cwd) {
  job=CreateJobObject(IntPtr.Zero,null);if(job==IntPtr.Zero) Check(false);
  var limits=new EXTENDED_LIMIT();limits.Basic.Flags=0x2000|0x200|0x8;limits.Basic.Active=100;limits.JobMemory=new UIntPtr(1073741824UL);
  Check(SetInformationJobObject(job,9,ref limits,(uint)Marshal.SizeOf(limits)));
  var command=new StringBuilder(Quote(executable));foreach(string arg in args)command.Append(" "+Quote(arg));
  var start=new STARTUPINFO();start.cb=(uint)Marshal.SizeOf(start);PROCESS_INFORMATION info;
  Check(CreateProcess(executable,command,IntPtr.Zero,IntPtr.Zero,false,0x08000004,IntPtr.Zero,cwd,ref start,out info));
  try {Check(AssignProcessToJobObject(job,info.process));if(ResumeThread(info.thread)==0xffffffff) Check(false);return info.pid;}
  catch {TerminateProcess(info.process,1);TerminateJobObject(job,1);throw;}
  finally {CloseHandle(info.thread);CloseHandle(info.process);}
 }
 public static void Stop() {if(job!=IntPtr.Zero){TerminateJobObject(job,0);CloseHandle(job);job=IntPtr.Zero;}}
}
'@
try {
 $config = [Console]::ReadLine() | ConvertFrom-Json
 $browserPid = [BytePathJob]::Start([string]$config.executable,[string[]]$config.args,[string]$config.cwd)
 [Console]::WriteLine('READY:' + $browserPid)
 [Console]::Out.Flush()
 while ($null -ne [Console]::ReadLine()) {}
} catch {
 [Console]::Error.WriteLine('Chromium Job Object could not be initialized: ' + $_.Exception.Message)
 exit 1
} finally { [BytePathJob]::Stop() }
